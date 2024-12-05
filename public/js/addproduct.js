const fileInput = document.querySelector('#file-input');
const imageContainer = document.querySelector('#image-container');
const saveButton = document.querySelector('.save');
let cropperInstances = [];

// Handle file input change
fileInput.addEventListener('change', (event) => {
  const files = event.target.files;

  // Clear previous images and Cropper instances
  imageContainer.innerHTML = '';
  cropperInstances = [];

  // Loop through each selected file
  Array.from(files).forEach((file, index) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      // Create image wrapper and image element
      const imgWrapper = document.createElement('div');
      imgWrapper.classList.add('img-item', 'mb-3');
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.maxWidth = '100%'; // Prevent oversized images

      imgWrapper.appendChild(img);
      imageContainer.appendChild(imgWrapper);

      // Initialize Cropper after the image is loaded
      img.onload = () => {
        const cropper = new Cropper(img, {
          aspectRatio: 1, // Example: Square crop
          viewMode: 1, // Restrict cropping to the visible image area
          autoCropArea: 1, // Ensure full coverage
        });
        cropperInstances.push(cropper);
      };
    };

    reader.readAsDataURL(file); // Load the image
  });

  // Show the save button when images are loaded
  saveButton.classList.remove('hide');
});

// Handle Save Button Click
saveButton.addEventListener('click', () => {
  imageContainer.innerHTML = ''; // Clear container for cropped images

  // Process each Cropper instance
  cropperInstances.forEach((cropper, index) => {
    const croppedCanvas = cropper.getCroppedCanvas({
      width: 300, // Fixed size for cropped output
      height: 300,
    });

    // Compress output image
    const croppedImageSrc = croppedCanvas.toDataURL('image/jpeg', 0.8); // Compression: 80% quality

    // Create cropped image and download link
    const imgWrapper = document.createElement('div');
    imgWrapper.classList.add('img-item', 'mb-3');
    const croppedImage = document.createElement('img');
    croppedImage.src = croppedImageSrc;
    croppedImage.style.maxWidth = '100%'; // Keep the image responsive
    const downloadLink = document.createElement('a');
    downloadLink.href = croppedImageSrc;
    downloadLink.download = `cropped-image-${index + 1}.jpg`;
    downloadLink.textContent = 'Download';
    downloadLink.classList.add('btn', 'btn-success', 'mt-2');

    imgWrapper.appendChild(croppedImage);
    imgWrapper.appendChild(downloadLink);
    imageContainer.appendChild(imgWrapper);
  });

  // Hide save button after saving
  saveButton.classList.add('hide');
});