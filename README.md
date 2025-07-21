# Text Behind Image Editor

A React-based Adobe Express Add-on that allows users to create stunning text-behind-object effects using background removal.

##  Quick Links

🎮 **[Try TextBehindImage Live](https://adobesparkpost.app.link/TR9Mb7TXFLb?mode=private&claimCode=wij4j06m3:6PF6XRL2)** - Experience the add-on in Adobe Express  
📺 **[Watch Demo Video](https://youtu.be/OEjUdmbBtHo)** - See TextBehindImage in action


## Features

- **Image Upload**: Upload an image to remove its background automatically.
- **Text Customization**: Add and customize text with adjustable size, color, position, and rotation.
- **Live Preview**: Real-time preview of the composite image with text placed behind the foreground object.
- **Canvas Integration**: Add the final composite image directly to the Adobe Express canvas.
- **Download Option**: Download the final image as a PNG file.
- **Reset Settings**: Reset text settings to default values for quick adjustments.

## Prerequisites

- Node.js (version 16 or higher)
- Adobe Express Add-on SDK
- Internet connection for background removal (`@imgly/background-removal`)

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/rishabhknowss/textbehindimage-adobe
   cd text-behind-image-editor
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Adobe Express Add-on SDK**:
   - Ensure the Adobe Express Add-on SDK is included in your project.
   - Update the `AddOnSDKAPI` import in `App.tsx` to match your SDK configuration.

4. **Build the Project**:
   ```bash
   npm run build
   ```

5. **Run the Development Server**:
   ```bash
   npm run start
   ```

## Usage

1. **Upload an Image**:
   - Click the "Choose Image" button to upload an image.
   - The background will be automatically removed, creating a transparent foreground.

2. **Customize Text**:
   - Enter your desired text in the text field.
   - Adjust text size, color, horizontal/vertical position, and rotation using the sliders and color picker.

3. **Preview**:
   - View the real-time preview of your composite image with the text placed behind the foreground object.

4. **Add to Canvas or Download**:
   - Click "Add to Canvas" to insert the composite image into Adobe Express.
   - Click "Download" to save the image as a PNG file.
   - Use the "Reset" button to revert text settings to their defaults.

## How It Works

1. **Background Removal**:
   - The `@imgly/background-removal` library processes the uploaded image to create a transparent PNG with only the foreground object.

2. **Layer Composition**:
   - The app renders the original image as the background, places the customizable text in the middle, and overlays the transparent foreground.

3. **Final Composite**:
   - The transparent foreground acts as a mask, creating the effect of text appearing behind the object.

## Dependencies

- `react`: For building the user interface.
- `@swc-react/theme`, `@swc-react/button`, `@swc-react/textfield`, `@swc-react/slider`, `@swc-react/field-label`: Spectrum Web Components for Adobe Express UI.
- `@imgly/background-removal`: For background removal.
- Adobe Express Add-on SDK: For integration with Adobe Express.


## Known Limitations

- Background removal performance depends on image complexity and internet connection.
- Large images may take longer to process.
- The app is optimized for Adobe Express; standalone usage may require additional configuration.

## License

This project is licensed under the MIT License.
