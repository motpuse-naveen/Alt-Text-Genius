// client/src/components/ImageUploader.js
import React, { useState } from 'react';
import axios from 'axios';

function ImageUploader() {
  const [image, setImage] = useState(null);
  const [altText, setAltText] = useState('');
  const [preview, setPreview] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('image', image);

    try {
      const response = await axios.post('/api/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAltText(response.data.altText);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} />
        <button type="submit">Upload</button>
      </form>
      {preview && (
        <div>
          <img src={preview} alt={altText} style={{ maxWidth: '100%', marginTop: '20px' }} />
          <textarea
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            rows="4"
            cols="50"
            style={{ marginTop: '10px' }}
          />
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
