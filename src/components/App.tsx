"use client"

import React from "react"
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
  const [text, setText] = useState("AMAZING")
  const [textSize, setTextSize] = useState(120)
  const [textColor, setTextColor] = useState("#ffffff")
  const [textX, setTextX] = useState(50)
  const [textY, setTextY] = useState(50)
  const [textRotation, setTextRotation] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const imageUrl = URL.createObjectURL(file)
    setOriginalImage(imageUrl)
    setIsProcessing(true)

    try {
      const imageBlob = await removeBackground(imageUrl)
      const backgroundRemovedUrl = URL.createObjectURL(imageBlob)
      setBackgroundRemovedImage(backgroundRemovedUrl)
    } catch (error) {
      console.error("Error removing background:", error)
      alert("Failed to process image. Please try another image.")
    } finally {
      setIsProcessing(false)
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

  const addToCanvas = async () => {
    if (!previewCanvasRef.current) return

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

  const downloadImage = async () => {
    console.log("Download function called")

    if (!previewCanvasRef.current) {
      console.error("Canvas ref is null")
      alert("Canvas not ready. Please try again.")
      return
    }

    const canvas = previewCanvasRef.current
    console.log("Canvas dimensions:", canvas.width, "x", canvas.height)

    try {
      console.log("Converting canvas to blob...")

      // Use canvas.toBlob for better browser compatibility
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            console.error("Failed to create blob from canvas")
            alert("Failed to create image file. Please try again.")
            return
          }

          console.log("Blob created successfully, size:", blob.size, "bytes")

          try {
            // Method 1: Try using the modern File System Access API if available
            if ("showSaveFilePicker" in window) {
              console.log("Using File System Access API")
              const fileHandle = await (window as any).showSaveFilePicker({
                suggestedName: `text-behind-image-${Date.now()}.png`,
                types: [
                  {
                    description: "PNG Image",
                    accept: { "image/png": [".png"] },
                  },
                ],
              })
              const writable = await fileHandle.createWritable()
              await writable.write(blob)
              await writable.close()
              console.log("File saved successfully using File System Access API")
              alert("Image downloaded successfully!")
              return
            }
          } catch (fsError) {
            console.log("File System Access API failed or cancelled:", fsError)
          }

          // Method 2: Fallback to traditional download
          console.log("Using traditional download method")
          const url = URL.createObjectURL(blob)
          console.log("Blob URL created:", url)

          const link = document.createElement("a")
          link.href = url
          link.download = `text-behind-image-${Date.now()}.png`

          // Make link invisible but ensure it's in the DOM
          link.style.display = "none"
          document.body.appendChild(link)

          console.log("Triggering download...")
          link.click()

          // Clean up
          setTimeout(() => {
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            console.log("Cleanup completed")
          }, 100)

          // Show success message
          setTimeout(() => {
            alert("Download started! Check your Downloads folder.")
          }, 200)
        },
        "image/png",
        1.0,
      )
    } catch (error) {
      console.error("Error in download process:", error)
      alert(`Download failed: ${error.message}`)
    }
  }

  const checkDownloadSupport = () => {
    console.log("Browser download support:")
    console.log("- File System Access API:", "showSaveFilePicker" in window)
    console.log("- Blob support:", typeof Blob !== "undefined")
    console.log("- URL.createObjectURL:", typeof URL !== "undefined" && typeof URL.createObjectURL === "function")
    console.log("- Canvas.toBlob:", typeof HTMLCanvasElement.prototype.toBlob === "function")
  }

  useEffect(() => {
    checkDownloadSupport()
  }, [])

  const resetSettings = () => {
    setText("AMAZING")
    setTextSize(120)
    setTextColor("#ffffff")
    setTextX(50)
    setTextY(50)
    setTextRotation(0)
  }

  return (
    <Theme system="express" scale="medium" color="light">
      <div className="container">
        <div className="header">
          <h1>Text Behind Image Editor</h1>
        </div>

        <div className="main-content">
          <div className="sidebar">
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
                <Button size="m" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                  {isProcessing ? "Processing..." : "Choose Image"}
                </Button>
                {isProcessing && <p>This may take a moment.</p>}
              </div>
            </div>

            {/* Text Controls */}
            <div className="card">
              <h2>Text Settings</h2>

              <div className="control">
                <FieldLabel>Text</FieldLabel>
                <Textfield value={text} onInput={(e: any) => setText(e.target.value)} placeholder="Enter your text" />
              </div>

              <div className="compact-controls">
                <div className="control">
                  <FieldLabel>Size: {textSize}px</FieldLabel>
                  <Slider
                    value={textSize}
                    onInput={(e: any) => setTextSize(Number(e.target.value))}
                    max={200}
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

              <div className="control">
                <FieldLabel>Color</FieldLabel>
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
              </div>

              <div className="button-group">
                <Button size="m" variant="secondary" onClick={resetSettings}>
                  Reset
                </Button>
                <Button size="m" onClick={downloadImage} disabled={!backgroundRemovedImage}>
                  Download
                </Button>
                <Button size="m" onClick={addToCanvas} disabled={!backgroundRemovedImage}>
                  Add to Canvas
                </Button>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="preview-section">
            <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <h2>Preview</h2>
              <div className="preview">
                {originalImage ? (
                  <canvas ref={previewCanvasRef} className="preview-canvas" />
                ) : (
                  <p>Upload an image to get started</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Theme>
  )
}

export default App
