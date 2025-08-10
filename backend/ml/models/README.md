# AI Models Directory

Bu klasörde 3 farklı medikal görüntü analizi modeli bulunmalıdır:

## 📁 Model Dosyaları

### 1. 🫁 Pneumonia Detection Model
- **Dosya**: `pneumonia_detection.h5`  
- **Amaç**: Göğüs röntgenlerinde zatürre tespiti
- **Format**: Keras H5 model
- **Input**: 224x224x3 RGB görüntüler
- **Output**: [Normal, Pneumonia] - 2 sınıf

### 2. 🧠 Brain Tumor Detection Model  
- **Dosya**: `brain_tumor_detection.h5`
- **Amaç**: MRI/CT görüntülerinde beyin tümörü tespiti
- **Format**: Keras H5 model  
- **Input**: 224x224x3 RGB görüntüler
- **Output**: [No Tumor, Glioma, Meningioma, Pituitary] - 4 sınıf

### 3. 🧠 Alzheimer Detection Model
- **Dosya**: `alzheimer_detection.h5`
- **Amaç**: MRI görüntülerinde Alzheimer/demans tespiti  
- **Format**: Keras H5 model
- **Input**: 224x224x3 RGB görüntüler
- **Output**: [Non Demented, Very Mild, Mild, Moderate] - 4 sınıf

## 🚀 Model Kullanımı

### Manuel Model İndirme
Model dosyalarınızı bu klasöre yerleştirin:

```bash
backend/ml/models/
├── pneumonia_detection.h5    # Zatürre tespit modeli
├── brain_tumor_detection.h5  # Beyin tümörü tespit modeli  
├── alzheimer_detection.h5    # Alzheimer tespit modeli
└── README.md                 # Bu dosya
```

### Otomatik Model Yükleme
Sistem başlangıcında modeller otomatik yüklenecek:

```javascript
// Her model için ayrı endpoint
POST /api/prediction/predict/pneumonia
POST /api/prediction/predict/brain-tumor  
POST /api/prediction/predict/alzheimer

// Otomatik tespit
POST /api/prediction/predict (dosya adına göre model seçimi)
```

## 🔧 Model Eğitimi 

Kendi modelinizi eğitmek için:

1. **Dataset hazırlayın** (X-ray, MRI, CT görüntüleri)
2. **TensorFlow/Keras ile model eğitin**
3. **Model'i H5 formatında kaydedin**
4. **Bu klasöre yerleştirin**

## 📊 Demo Mode

Model dosyaları yoksa sistem otomatik demo modunda çalışır ve mock sonuçlar döndürür.

## ⚠️ Önemli Notlar

- Model dosyaları büyük olabilir (100MB+)
- `.gitignore`'da model dosyaları excluded
- Prod deployment için model dosyalarını ayrıca upload edin
- TensorFlow.js Node.js v22 ile uyumluluk sorunları olabilir

## 🔗 Model Kaynakları

- **Kaggle**: Medical imaging datasets
- **Papers with Code**: Pre-trained models
- **TensorFlow Hub**: Medical models
- **GitHub**: Open source medical AI models
