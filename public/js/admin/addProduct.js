const fileInput = document.getElementById('file-input');
const imageList = document.getElementById('image-preview-container');
const cropperModal = document.getElementById('cropper-modal');
const cropperImage = document.getElementById('cropper-image');
const cropButton = document.getElementById('crop-btn');
const cancelButton = document.getElementById('cancel-btn');
const form = document.getElementById('product-form');
const colors = document.querySelectorAll('.color-option');
const colorElement = document.getElementById('colors');
const selectedColor = document.querySelector('input[name="color"]:checked');
const selectedVariant = document.querySelector('input[name="variant"]:checked');
const selectedColors = new Set();
let cropper;
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const imageArray = [];
let currentFileIndex = 0;
let currentFiles = [];

if (fileInput && imageList) {
  fileInput.addEventListener('change', (event) => {
    currentFiles = Array.from(event.target.files);

    processNextFile();
  });

  function processNextFile() {
    if (currentFileIndex >= currentFiles.length) {
      currentFileIndex = 0;
      return;
    }

    const file = currentFiles[currentFileIndex];

    if (file.size > MAX_FILE_SIZE) {
      alert(`File ${file.name} exceeds the 2MB size limit.`);
      currentFileIndex++;
      processNextFile();
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert(`File ${file.name} is not a valid image type.`);
      currentFileIndex++;
      processNextFile();
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      cropperImage.src = e.target.result;
      cropperModal.style.display = 'flex';

      cropper = new Cropper(cropperImage, {
        aspectRatio: 1,
        viewMode: 1,
      });
    };

    reader.readAsDataURL(file);
  }

  cropButton.addEventListener('click', (e) => {
    e.preventDefault();
    const canvas = cropper.getCroppedCanvas();

    if (!canvas) {
      alert('Please crop the image properly.');
      return;
    }


    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        addImage(url, blob);
      }

      currentFileIndex++;
      processNextFile();
    });

    cropper.destroy();
    cropperModal.style.display = 'none';
  });

  cancelButton.addEventListener('click', (e) => {
    e.preventDefault();

    cropper.destroy();
    cropperModal.style.display = 'none';

    currentFileIndex++;
    processNextFile();
  });

  function addImage(imageUrl, file) {
    imageArray.push({ imageUrl, file });
    renderImages();
  }

  function renderImages() {
    imageList.innerHTML = '';
    imageArray.forEach((imageData, index) => {
      const imageItem = document.createElement('div');
      imageItem.classList.add('image-item');

      const imgElement = document.createElement('img');
      imgElement.src = imageData.imageUrl;
      imgElement.alt = 'Uploaded image';
      imageItem.appendChild(imgElement);

      const removeButton = document.createElement('button');
      removeButton.classList.add('remove-btn');
      removeButton.innerHTML = 'X';
      removeButton.addEventListener('click', () => removeImage(index));
      imageItem.appendChild(removeButton);

      imageList.appendChild(imageItem);
    });
  }

  function removeImage(index) {
    imageArray.splice(index, 1);
    renderImages();
  }

  function removeFromFormData(formData, keyToRemove) {
    const newFormData = new FormData();

    for (let [key, value] of formData.entries()) {
      if (key !== keyToRemove) {
        newFormData.append(key, value);
      }
    }

    return newFormData;
  }

  function blobToFile(blob, fileName) {
    return new File([blob], fileName, { type: blob.type });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let validForm = true;

    document.querySelectorAll('.error-message').forEach(msg => msg.remove());

    // function to show error messages
    function showError(element, message) {
      const error = document.createElement('span');
      error.className = 'error-message';
      error.style.color = 'red';
      error.innerText = message;
      element.parentElement.appendChild(error);
      element.focus();
    }

    // Validate Product Name
    let productName = document.getElementById('productName');
    if (productName.value.trim() === "") {
      showError(productName, "Product name is required.");
      validForm = false;
    }

    // Validate Stock Status
    let stockStatus = document.getElementById('stock');
    if (!stockStatus.value) {
      showError(stockStatus, "Stock status is required.");
      validForm = false;
    }

    // Validate Available Quantity
    let quantity = document.getElementById('quantity');
    if (quantity.value.trim() === "" || parseInt(quantity.value) <= 0) {
      showError(quantity, "Available quantity must be a positive number.");
      validForm = false;
    }

    // Validate Category
    let category = document.getElementById('category');
    if (!category.value) {
      showError(category, "Please select a category.");
      validForm = false;
    }

    // Validate Processor
    let processor = document.getElementById('processor');
    if (!processor.value) {
      showError(processor, "Please select a processor.");
      validForm = false;
    }

    // Validate Description
    let description = document.getElementById('description');
    if (description.value.trim() === "") {
      showError(description, "Description is required.");
      validForm = false;
    }

    // Validate Images
    let fileInput = document.getElementById('file-input');
    if (imageArray.length < 3) { // Ensure imageArray is defined and populated
      showError(fileInput, "Please upload at least 3 images.");
      validForm = false;
    }

    // Validate Colors
    const colorContainer = document.querySelector('.color-error'); // Target the container
    const selectedColor = document.querySelector('input[name="color"]:checked');
    if (!selectedColor) {
      showError(colorContainer, "Please select a color.");
      validForm = false;
    }

    // Validate Variants
    const variantContainer = document.querySelector('.varient-error'); // Target the container
    const selectedVariant = document.querySelector('input[name="variant"]:checked');
    if (!selectedVariant) {
      showError(variantContainer, "Please select a variant.");
      validForm = false;
    }

    let offer = document.getElementById('offer');
    if (offer.value.trim() === "" || parseInt(offer.value) <= 0) {
      showError(offer, "offer must be a positive number");
      validForm = false;
    }
    let price = document.getElementById('price');
    if (price.value.trim() === "" || parseInt(price.value) <= 0) {
      showError(price, "Price must be a positive number.");
      validForm = false;
    }



    // Final Submission
    if (!validForm) {
      Swal.fire({
        title: 'Form Error!',
        text: 'Please correct the errors before submitting the form.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }
    // Proceed with form submission or further processing
    console.log("Form validated and ready for submission.");


    if (!validForm) return;

    const formData = removeFromFormData(new FormData(form), 'images');
    imageArray.forEach((imageData, index) => {
      formData.append("images", blobToFile(imageData.file, imageData.file.name || `cropped - ${index}.jpg`));
    });

    // console.log(formData);

    fetch('/admin/addProduct', {
      method: 'POST',
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to fetch');
      })
      .then((data) => {
        if (data.success) {
          // alert_success(data.message);
          showAlert(data.message, "success")
          setTimeout(() => {
            window.location.reload();
          }, 3100);
        } else {
          // alert(data.message);
          console.log(data.message);

          showAlert(data.message, "danger")
        }

      })
      .catch((error) => {
        console.error('Fetch error:', error);
      });
  });
}
function showAlert(message, type) {

  const alertBox = document.createElement('div');
  alertBox.id = 'alertBox';
  alertBox.className = `alert alert-${type} show`;
  alertBox.role = 'alert';
  alertBox.innerHTML = message;
  document.body.appendChild(alertBox);
  setTimeout(() => {
    alertBox.classList.remove('show');
    alertBox.classList.add('hide');
    setTimeout(() => alertBox.remove(), 700);
  }, 3000);
}


//offer price section

document.getElementById('price').addEventListener('input', calculateOfferPrice);
document.getElementById('offer').addEventListener('input', calculateOfferPrice);

function calculateOfferPrice() {
  const price = parseFloat(document.getElementById('price').value) || 0;
  const offer = parseFloat(document.getElementById('offer').value) || 0;

  const offerPrice = price - (price * (offer / 100));
  document.getElementById('offerPrice').value = offerPrice.toFixed(0);
}
calculateOfferPrice()
