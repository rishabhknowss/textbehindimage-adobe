import React, { useRef, useState, useCallback, useEffect } from "react";
import { Theme } from "@swc-react/theme";
import { Button } from "@swc-react/button";
import { Textfield } from "@swc-react/textfield";
import { Slider } from "@swc-react/slider";
import { FieldLabel } from "@swc-react/field-label";
import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";
import { removeBackground } from "@imgly/background-removal";
import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import "./App.css";

interface AppProps {
    addOnUISdk: AddOnSDKAPI;
}

const App: React.FC<AppProps> = ({ addOnUISdk }) => {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [backgroundRemovedImage, setBackgroundRemovedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [text, setText] = useState("AMAZING");
    const [textSize, setTextSize] = useState(120);
    const [textColor, setTextColor] = useState("#ffffff");
    const [textX, setTextX] = useState(50);
    const [textY, setTextY] = useState(50);
    const [textRotation, setTextRotation] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const imageUrl = URL.createObjectURL(file);
        setOriginalImage(imageUrl);

        setIsProcessing(true);
        try {
            const imageBlob = await removeBackground(imageUrl);
            const backgroundRemovedUrl = URL.createObjectURL(imageBlob);
            setBackgroundRemovedImage(backgroundRemovedUrl);
        } catch (error) {
            console.error("Error removing background:", error);
            alert("Failed to process image. Please try another image.");
        } finally {
            setIsProcessing(false);
        }
    };

    const updatePreview = useCallback(() => {
        if (!originalImage || !backgroundRemovedImage || !previewCanvasRef.current) return;

        const canvas = previewCanvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Step 1: Draw original image (background)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Step 2: Draw text
            ctx.save();
            ctx.font = `bold ${textSize * 2}px Arial`;
            ctx.fillStyle = textColor;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const x = (textX / 100) * canvas.width;
            const y = (textY / 100) * canvas.height;

            ctx.translate(x, y);
            ctx.rotate((textRotation * Math.PI) / 180);
            ctx.fillText(text, 0, 0);
            ctx.restore();

            // Step 3: Draw background-removed image (foreground)
            const foregroundImg = new Image();
            foregroundImg.crossOrigin = "anonymous";
            foregroundImg.onload = () => {
                ctx.drawImage(foregroundImg, 0, 0, canvas.width, canvas.height);
            };
            foregroundImg.src = backgroundRemovedImage;
        };
        img.src = originalImage;
    }, [originalImage, backgroundRemovedImage, text, textSize, textColor, textX, textY, textRotation]);

    useEffect(() => {
        updatePreview();
    }, [updatePreview]);

    const addToCanvas = async () => {
        if (!previewCanvasRef.current) return;

        const canvas = previewCanvasRef.current;
        const dataUrl = canvas.toDataURL("image/png");

        try {
            // Convert data URL to Blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();

            // Add image to Adobe Express canvas
            await addOnUISdk.app.document.addImage(blob);
            alert("Image added to canvas!");
        } catch (error) {
            console.error("Error adding image to canvas:", error);
            alert("Failed to add image to canvas.");
        }
    };

    const downloadImage = () => {
        if (!previewCanvasRef.current) return;

        const canvas = previewCanvasRef.current;
        const link = document.createElement("a");
        link.download = "text-behind-image.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    const resetSettings = () => {
        setText("AMAZING");
        setTextSize(120);
        setTextColor("#ffffff");
        setTextX(50);
        setTextY(50);
        setTextRotation(0);
    };

    return (
        <Theme system="express" scale="medium" color="light">
            <div className="container">
                <h1>Text Behind Image Editor</h1>
                <p>Create stunning text-behind-object effects with AI background removal</p>

                <div className="grid">
                    {/* Upload Section */}
                    <div className="card">
                        <h2>Upload Image</h2>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            style={{ display: "none" }}
                        />
                        <Button
                            size="m"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessing}
                        >
                            {isProcessing ? "Processing..." : "Choose Image"}
                        </Button>
                        {isProcessing && <p>Removing background... This may take a moment.</p>}
                    </div>

                    {/* Text Controls */}
                    <div className="card">
                        <h2>Text Settings</h2>
                        <div className="control">
                            <FieldLabel>Text</FieldLabel>
                            <Textfield
                                value={text}
                                onInput={(e: any) => setText(e.target.value)} // Changed to onInput for SWC
                                placeholder="Enter your text"
                            />
                        </div>
                        <div className="control">
                            <FieldLabel>Size: {textSize}px</FieldLabel>
                            <Slider
                                value={textSize}
                                onInput={(e: any) => setTextSize(Number(e.target.value))} // Ensure number type
                                max={200}
                                min={20}
                                step={5}
                            />
                        </div>
                        <div className="control">
                            <FieldLabel>Color</FieldLabel>
                            <input
                                type="color"
                                value={textColor}
                                onChange={(e) => setTextColor(e.target.value)}
                            />
                        </div>
                        <div className="control">
                            <FieldLabel>Horizontal Position: {textX}%</FieldLabel>
                            <Slider
                                value={textX}
                                onInput={(e: any) => setTextX(Number(e.target.value))} // Ensure number type
                                max={100}
                                min={0}
                                step={1}
                            />
                        </div>
                        <div className="control">
                            <FieldLabel>Vertical Position: {textY}%</FieldLabel>
                            <Slider
                                value={textY}
                                onInput={(e: any) => setTextY(Number(e.target.value))} // Ensure number type
                                max={100}
                                min={0}
                                step={1}
                            />
                        </div>
                        <div className="control">
                            <FieldLabel>Rotation: {textRotation}°</FieldLabel>
                            <Slider
                                value={textRotation}
                                onInput={(e: any) => setTextRotation(Number(e.target.value))} // Ensure number type
                                max={180}
                                min={-180}
                                step={5}
                            />
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

                    {/* Preview Section */}
                    <div className="card">
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

                {/* How it Works Section */}
                <div className="card">
                    <h2>How It Works</h2>
                    <div className="how-it-works">
                        <div>
                            <h3>1. Background Removal</h3>
                            <p>AI removes the background, creating a transparent PNG with only the foreground object.</p>
                        </div>
                        <div>
                            <h3>2. Layer Composition</h3>
                            <p>Text is placed between the original background and the foreground object.</p>
                        </div>
                        <div>
                            <h3>3. Final Composite</h3>
                            <p>The transparent foreground acts as a mask, creating the "behind" effect.</p>
                        </div>
                    </div>
                </div>
            </div>
        </Theme>
    );
};

export default App;