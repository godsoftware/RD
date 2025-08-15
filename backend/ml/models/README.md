# AI Models Directory

Bu klasörde 3 farklı medikal görüntü analizi modeli bulunmalıdır:

## 📁 Model Dosyaları

### 1. 🫁 Pneumonia Detection Model
- **Klasör**: `pneumonia_tfjs/`  
- **Amaç**: Göğüs röntgenlerinde zatürre tespiti
- **Format**: TensorFlow.js Layers (model.json + shards)
- **Input**: 224x224x3 RGB görüntüler
- **Output**: [Normal, Pneumonia] - 2 sınıf

### 2. 🧠 Brain Tumor Detection Model  
- **Klasör**: `brain_tumor_tfjs/`
- **Amaç**: MRI/CT görüntülerinde beyin tümörü tespiti
- **Format**: TensorFlow.js Layers (model.json + shards)  
- **Input**: 224x224x3 RGB görüntüler
- **Output**: [Glioma, Meningioma, NoTumor] - 3 sınıf

### 3. 🧫 Tuberculosis Detection Model
- **Klasör**: `tb_tfjs/`
- **Amaç**: Göğüs röntgenlerinde tüberküloz tespiti  
- **Format**: TensorFlow.js Layers (model.json + shards)
- **Input**: 224x224x3 RGB görüntüler
- **Output**: [Normal, Tuberculosis] - 2 sınıf

## 🚀 Model Kullanımı

### Manuel Model İndirme
Model dosyalarınızı bu klasöre yerleştirin:

```bash
backend/ml/models/
├── pneumonia_tfjs/         # Zatürre tespit modeli (TFJS)
│   ├── model.json
│   └── group1-shard*.bin
├── brain_tumor_tfjs/       # Beyin tümörü tespit modeli (TFJS)  
│   ├── model.json
│   └── group1-shard*.bin
├── tb_tfjs/                # Tüberküloz tespit modeli (TFJS)
│   ├── model.json
│   └── group1-shard*.bin
└── README.md
```

### Otomatik Model Yükleme
Sistem başlangıcında modeller otomatik yüklenecek:

```javascript
// Her model için ayrı endpoint
POST /api/prediction/predict/pneumonia
POST /api/prediction/predict/brain-tumor  
POST /api/prediction/predict/tuberculosis

// Otomatik tespit
POST /api/prediction/predict (dosya adına göre model seçimi)
```

## 🔧 Model Eğitimi 

Kendi modelinizi eğitmek için:

1. **Dataset hazırlayın** (X-ray, MRI, CT görüntüleri)
2. **TensorFlow/Keras ile model eğitin**
3. **Model'i H5 formatında kaydedin**
4. **TFJS'e çevirin**:
   ```bash
   tensorflowjs_converter --input_format keras \
       path/to/model.h5 \
       ./backend/ml/models/model_tfjs
   ```
5. **Bu klasöre yerleştirin**

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
