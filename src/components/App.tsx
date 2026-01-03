"use client"

import React from "react"
import { flushSync } from "react-dom"
import { useRef, useState, useCallback, useEffect } from "react"
import { Theme } from "@swc-react/theme"
import { Button } from "@swc-react/button"
import { Textfield } from "@swc-react/textfield"
import { Slider } from "@swc-react/slider"
import { FieldLabel } from "@swc-react/field-label"
import "@spectrum-web-components/theme/express/scale-medium.js"
import "@spectrum-web-components/theme/express/theme-light.js"
import { removeBackground } from "@imgly/background-removal"
import type { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js"
import "./App.css"

interface AppProps {
  addOnUISdk: AddOnSDKAPI
}

const App: React.FC<AppProps> = ({ addOnUISdk }) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [backgroundRemovedImage, setBackgroundRemovedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPreviewVisible, setIsPreviewVisible] = useState(true)
  const [textError, setTextError] = useState<string | null>(null)
  const [text, setText] = useState("AMAZING")
  const [textSize, setTextSize] = useState(120)
  const [textColor, setTextColor] = useState("#ffffff")
  const [textX, setTextX] = useState(50)
  const [textY, setTextY] = useState(50)
  const [textRotation, setTextRotation] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const processingIdRef = useRef<number>(0)
  const currentImageUrlRef = useRef<string | null>(null)

  const cancelProcessing = useCallback(() => {
    // Increment processing ID to invalidate any in-flight operation
    processingIdRef.current += 1

    // First priority: hide the cancel button immediately
    flushSync(() => {
      setIsProcessing(false)
    })

    // Defer remaining state updates and cleanup to next frame
    requestAnimationFrame(() => {
      setOriginalImage(null)
      setBackgroundRemovedImage(null)

      if (currentImageUrlRef.current) {
        URL.revokeObjectURL(currentImageUrlRef.current)
        currentImageUrlRef.current = null
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    })
  }, [])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Increment processing ID to invalidate any previous in-flight operation
    processingIdRef.current += 1
    const currentProcessingId = processingIdRef.current

    // Clean up previous image URL if exists
    if (currentImageUrlRef.current) {
      URL.revokeObjectURL(currentImageUrlRef.current)
    }

    const imageUrl = URL.createObjectURL(file)
    currentImageUrlRef.current = imageUrl
    setOriginalImage(imageUrl)
    setBackgroundRemovedImage(null)
    setIsProcessing(true)
    setIsPreviewVisible(true)

    try {
      const imageBlob = await removeBackground(imageUrl)

      // Check if this operation was cancelled (a newer one started or user cancelled)
      if (currentProcessingId !== processingIdRef.current) {
        URL.revokeObjectURL(imageUrl)
        return
      }

      const backgroundRemovedUrl = URL.createObjectURL(imageBlob)
      setBackgroundRemovedImage(backgroundRemovedUrl)
    } catch (error) {
      // Only handle error if this operation is still current
      if (currentProcessingId !== processingIdRef.current) {
        return
      }
      console.error("Error removing background:", error)
      alert("Failed to process image. Please try another image.")
      URL.revokeObjectURL(imageUrl)
      currentImageUrlRef.current = null
      setOriginalImage(null)
    } finally {
      // Only update processing state if this operation is still current
      if (currentProcessingId === processingIdRef.current) {
        setIsProcessing(false)
      }
    }
  }

  const updatePreview = useCallback(() => {
    if (!originalImage || !backgroundRemovedImage || !previewCanvasRef.current) return

    const canvas = previewCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Step 1: Draw original image (background)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Step 2: Draw text
      ctx.save()
      ctx.font = `bold ${textSize * 2}px Arial`
      ctx.fillStyle = textColor
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      const x = (textX / 100) * canvas.width
      const y = (textY / 100) * canvas.height
      ctx.translate(x, y)
      ctx.rotate((textRotation * Math.PI) / 180)
      ctx.fillText(text, 0, 0)
      ctx.restore()

      // Step 3: Draw background-removed image (foreground)
      const foregroundImg = new Image()
      foregroundImg.crossOrigin = "anonymous"
      foregroundImg.onload = () => {
        ctx.drawImage(foregroundImg, 0, 0, canvas.width, canvas.height)
      }
      foregroundImg.src = backgroundRemovedImage
    }
    img.src = originalImage
  }, [originalImage, backgroundRemovedImage, text, textSize, textColor, textX, textY, textRotation])

  useEffect(() => {
    updatePreview()
  }, [updatePreview])

  // Redraw canvas when preview becomes visible again
  useEffect(() => {
    if (isPreviewVisible) {
      updatePreview()
    }
  }, [isPreviewVisible, updatePreview])

  const addToCanvas = async () => {
    // Validate text input
    if (!text.trim()) {
      setTextError("Please enter text.")
      return
    }

    if (!previewCanvasRef.current) return

    setTextError(null)
    const canvas = previewCanvasRef.current
    const dataUrl = canvas.toDataURL("image/png")

    try {
      // Convert data URL to Blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()

      // Add image to Adobe Express canvas
      await addOnUISdk.app.document.addImage(blob)
      alert("Image added to canvas!")
    } catch (error) {
      console.error("Error adding image to canvas:", error)
      alert("Failed to add image to canvas.")
    }
  }

  const resetAll = () => {
    // Clear image data
    if (currentImageUrlRef.current) {
      URL.revokeObjectURL(currentImageUrlRef.current)
      currentImageUrlRef.current = null
    }
    setOriginalImage(null)
    setBackgroundRemovedImage(null)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    // Reset text settings
    setText("")
    setTextSize(120)
    setTextColor("#ffffff")
    setTextX(50)
    setTextY(50)
    setTextRotation(0)
    setTextError(null)
    setIsPreviewVisible(true)
  }

  const hidePreview = useCallback(() => {
    setIsPreviewVisible(false)
  }, [])

  const showPreview = useCallback(() => {
    setIsPreviewVisible(true)
  }, [])

  return (
    <Theme system="express" scale="medium" color="light">
      <div className="container">
        <div className="header">
          <h1>Text Behind Image Editor</h1>
        </div>

        <div className="main-content">
          {/* Upload Section */}
          <div className="card">
            <h2 style={{ display: "flex", justifyContent: "center" }}>Upload Image</h2>
            <div className="upload-section">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: "none" }}
              />
              <div className="upload-buttons">
                <Button size="m" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                  {isProcessing ? "Processing..." : "Choose Image"}
                </Button>
                {isProcessing && (
                  <Button size="m" variant="secondary" onClick={cancelProcessing}>
                    Cancel
                  </Button>
                )}
              </div>
              {isProcessing && (
                <div className="processing-status">
                  <div className="spinner"></div>
                  <p>Processing image... This may take a moment.</p>
                </div>
              )}
            </div>
          </div>

          {/* Text Settings */}
          <div className="card">
            <h2>Text Settings</h2>

            <div className="control">
              <FieldLabel>Text</FieldLabel>
              <Textfield
                value={text}
                onInput={(e: any) => {
                  setText(e.target.value)
                  if (textError) setTextError(null)
                }}
                placeholder="Enter your text"
              />
              {textError && <p className="error-message">{textError}</p>}
            </div>

            <div className="control">
              <FieldLabel>Size: {textSize}px</FieldLabel>
              <Slider
                value={textSize}
                onInput={(e: any) => setTextSize(Number(e.target.value))}
                max={1000}
                min={20}
                step={5}
              />
            </div>

            <div className="control">
              <FieldLabel>Rotation: {textRotation}°</FieldLabel>
              <Slider
                value={textRotation}
                onInput={(e: any) => setTextRotation(Number(e.target.value))}
                max={180}
                min={-180}
                step={5}
              />
            </div>

            <div className="control">
              <FieldLabel>Color</FieldLabel>
              <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
            </div>
          </div>

          {/* Preview Section - Uses CSS to hide/show to preserve canvas content */}
          {originalImage && (
            <div className={`card preview-card ${!isPreviewVisible ? 'hidden' : ''}`}>
              <div className="preview-header">
                <h2>Preview</h2>
                {!isProcessing && (
                  <Button size="s" variant="secondary" onClick={isPreviewVisible ? hidePreview : showPreview}>
                    {isPreviewVisible ? 'Hide' : 'Show'}
                  </Button>
                )}
              </div>
              {isPreviewVisible && (
                <div className="preview">
                  <canvas ref={previewCanvasRef} className="preview-canvas" />
                </div>
              )}
            </div>
          )}

          {/* Position Controls */}
          <div className="card">
            <h2>Position Controls</h2>
            
            <div className="control">
              <FieldLabel>X Position: {textX}%</FieldLabel>
              <Slider
                value={textX}
                onInput={(e: any) => setTextX(Number(e.target.value))}
                max={100}
                min={0}
                step={1}
              />
            </div>

            <div className="control">
              <FieldLabel>Y Position: {textY}%</FieldLabel>
              <Slider
                value={textY}
                onInput={(e: any) => setTextY(Number(e.target.value))}
                max={100}
                min={0}
                step={1}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="card">
            <h2>Actions</h2>
            <div className="button-group">
              <Button size="m" variant="secondary" onClick={resetAll}>
                Reset
              </Button>
              <Button size="m" onClick={addToCanvas} disabled={!backgroundRemovedImage || !text.trim()}>
                Add to Canvas
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Theme>
  )
}

export default App
