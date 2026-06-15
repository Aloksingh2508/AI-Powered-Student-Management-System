import cv2
import numpy as np
import base64
import os
import logging

logger = logging.getLogger(__name__)

# Initialize OpenCV Face Cascade Classifier
try:
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)
except Exception as e:
    logger.error(f"Error loading OpenCV Haar Cascade: {e}")
    face_cascade = None


def decode_base64_image(base64_str: str) -> np.ndarray:
    """Decode a base64 data URI or plain base64 string into an OpenCV image."""
    try:
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        img_data = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        logger.error(f"Base64 image decoding failed: {e}")
        return None


def extract_and_normalize_face(img: np.ndarray) -> str:
    """
    Detect a face, crop it, resize to 150x150, convert to grayscale, 
    and return it as a base64 encoded JPG string.
    """
    if img is None or face_cascade is None:
        return None

    try:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(50, 50))
        
        if len(faces) == 0:
            logger.warning("No face detected in image.")
            return None
            
        # Crop the first detected face
        x, y, w, h = faces[0]
        face_crop = gray[y:y+h, x:x+w]
        
        # Resize to standardized template dimensions
        face_resized = cv2.resize(face_crop, (150, 150))
        
        # Encode back to base64
        _, buffer = cv2.imencode('.jpg', face_resized)
        encoded_str = base64.b64encode(buffer).decode('utf-8')
        return f"data:image/jpeg;base64,{encoded_str}"
        
    except Exception as e:
        logger.error(f"Face extraction failed: {e}")
        return None


def verify_faces(registered_face_b64: str, probe_face_img: np.ndarray) -> bool:
    """
    Compare a probe webcam image against the registered template image.
    Uses Template Matching and Histogram comparison.
    """
    if not registered_face_b64 or probe_face_img is None or face_cascade is None:
        return False

    try:
        # 1. Decode registered template face
        reg_img = decode_base64_image(registered_face_b64)
        if reg_img is None:
            return False
        if len(reg_img.shape) == 3:
            reg_gray = cv2.cvtColor(reg_img, cv2.COLOR_BGR2GRAY)
        else:
            reg_gray = reg_img

        # 2. Extract and normalize the probe face
        gray_probe = cv2.cvtColor(probe_face_img, cv2.COLOR_BGR2GRAY)
        probe_faces = face_cascade.detectMultiScale(gray_probe, scaleFactor=1.1, minNeighbors=4, minSize=(50, 50))
        
        if len(probe_faces) == 0:
            return False
            
        px, py, pw, ph = probe_faces[0]
        probe_crop = gray_probe[py:py+ph, px:px+pw]
        probe_resized = cv2.resize(probe_crop, (150, 150))

        # 3. Compare using OpenCV template match correlation coefficient
        res = cv2.matchTemplate(probe_resized, reg_gray, cv2.TM_CCOEFF_NORMED)
        _, max_val, _, _ = cv2.minMaxLoc(res)

        # 4. Compare histograms
        hist1 = cv2.calcHist([probe_resized], [0], None, [256], [0, 256])
        hist2 = cv2.calcHist([reg_gray], [0], None, [256], [0, 256])
        cv2.normalize(hist1, hist1, 0, 1, cv2.NORM_MINMAX)
        cv2.normalize(hist2, hist2, 0, 1, cv2.NORM_MINMAX)
        hist_similarity = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)

        # Threshold criteria (tuning matching criteria for zero false matches)
        logger.info(f"Face Matching: TM_CCOEFF_NORMED={max_val:.3f}, HistCorrelation={hist_similarity:.3f}")
        
        # Standard threshold: template similarity > 0.55 AND histogram correlation > 0.4
        if max_val > 0.55 and hist_similarity > 0.4:
            return True
            
        return False
        
    except Exception as e:
        logger.error(f"Face verification encountered error: {e}")
        return False
