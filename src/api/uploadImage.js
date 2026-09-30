import api from './axios';

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4MB hard cap

// code는 common 번역 키다. 화면에서 t('common', err.code)로 사용자 언어에 맞춰 띄운다.
const uploadError = (code) => Object.assign(new Error(code), { code });

const compressImage = (file, maxWidth = 800, quality = 0.7) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    const fallback = () => {
      URL.revokeObjectURL(url);
      // HEIC 등 canvas가 처리 못하는 포맷은 업로드 거부
      const type = file.type.toLowerCase();
      if (type === 'image/heic' || type === 'image/heif' || type === '') {
        reject(uploadError('imageUnsupportedFormat'));
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        reject(uploadError('imageTooLarge'));
      } else {
        resolve(file);
      }
    };
    img.onerror = fallback;
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob) {
            if (file.size > MAX_UPLOAD_BYTES) {
              reject(uploadError('imageTooLarge'));
            } else {
              resolve(file);
            }
            return;
          }
          resolve(blob);
        }, 'image/jpeg', quality);
      } catch {
        fallback();
      }
    };
    img.src = url;
  });

const uploadToBackend = async (file, endpoint, oldUrl) => {
  const compressed = await compressImage(file);
  const formData = new FormData();
  formData.append('file', compressed, 'image.jpg');
  if (oldUrl) formData.append('oldUrl', oldUrl);
  // Content-Type을 undefined로 지정해 브라우저가 multipart/form-data boundary를 자동 설정하게 함
  const res = await api.post(endpoint, formData, { headers: { 'Content-Type': undefined } });
  return res.data.url;
};

export const uploadImage = (file, oldUrl) => uploadToBackend(file, '/upload/image', oldUrl);
export const uploadProfileImage = (file, oldUrl) => uploadToBackend(file, '/upload/profile-image', oldUrl);
