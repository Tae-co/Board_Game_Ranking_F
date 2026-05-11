import api from './axios';

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4MB hard cap

const compressImage = (file, maxWidth = 800, quality = 0.7) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    const fallback = () => {
      URL.revokeObjectURL(url);
      // HEIC 등 canvas가 처리 못하는 포맷은 업로드 거부
      const type = file.type.toLowerCase();
      if (type === 'image/heic' || type === 'image/heif' || type === '') {
        reject(new Error('지원하지 않는 이미지 형식입니다. JPEG 또는 PNG 파일을 사용해 주세요.'));
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        reject(new Error(`파일 크기가 너무 큽니다 (최대 4MB). 더 작은 이미지를 사용해 주세요.`));
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
              reject(new Error(`파일 크기가 너무 큽니다 (최대 4MB). 더 작은 이미지를 사용해 주세요.`));
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
