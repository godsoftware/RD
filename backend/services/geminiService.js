const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        console.log('⚠️  Gemini AI not configured - GEMINI_API_KEY not found');
        return;
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      this.isInitialized = true;
      
      console.log('✅ Gemini AI initialized successfully');
    } catch (error) {
      console.error('❌ Gemini AI initialization error:', error.message);
      this.isInitialized = false;
    }
  }

  /**
   * Generate medical interpretation using Gemini AI
   * @param {Object} predictionData - AI model prediction results
   * @param {Object} patientInfo - Patient information
   * @returns {Promise<Object>} Enhanced medical interpretation
   */
  async generateMedicalInterpretation(predictionData, patientInfo = {}) {
    if (!this.isInitialized) {
      return {
        success: false,
        message: 'Gemini AI not initialized',
        interpretation: predictionData.medicalInterpretation || 'Standard AI interpretation available'
      };
    }

    try {
      const prompt = this.buildMedicalPrompt(predictionData, patientInfo);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const interpretation = response.text();

      return {
        success: true,
        interpretation: interpretation,
        originalPrediction: predictionData.medicalInterpretation,
        generatedAt: new Date().toISOString(),
        model: 'gemini-1.5-flash'
      };

    } catch (error) {
      console.error('Gemini AI generation error:', error);
      return {
        success: false,
        message: error.message,
        interpretation: predictionData.medicalInterpretation || 'Standard AI interpretation available'
      };
    }
  }

  /**
   * Build comprehensive medical prompt for Gemini AI
   * @param {Object} predictionData - AI prediction results
   * @param {Object} patientInfo - Patient demographics and history
   * @returns {string} Formatted prompt
   */
  buildMedicalPrompt(predictionData, patientInfo) {
    const {
      modelType,
      prediction,
      confidence,
      isPositive,
      allClasses = []
    } = predictionData;

    const {
      age,
      weight,
      gender,
      symptoms,
      medicalHistory
    } = patientInfo;

    return `Sen bir uzman doktor asistanısın. Aşağıdaki tıbbi görüntü analizi sonuçlarını değerlendirip detaylı bir tıbbi yorum yap.

**GÖRÜNTÜ ANALİZİ SONUÇLARI:**
- Model Tipi: ${modelType}
- Ana Tahmin: ${prediction}
- Güven Oranı: ${confidence}%
- Sonuç Durumu: ${isPositive ? 'POZİTİF (Anormallik tespit edildi)' : 'NEGATİF (Normal)'}

**HASTA BİLGİLERİ:**
- Yaş: ${age || 'Belirtilmemiş'}
- Kilo: ${weight || 'Belirtilmemiş'} kg
- Cinsiyet: ${gender || 'Belirtilmemiş'}
- Semptomlar: ${symptoms || 'Belirtilmemiş'}
- Tıbbi Geçmiş: ${medicalHistory || 'Belirtilmemiş'}

**TÜM SINIF SONUÇLARI:**
${allClasses.map(cls => `- ${cls.class}: ${cls.confidence}%`).join('\n')}

**İSTENEN YORUM FORMATI:**

1. **SONUÇ ÖZETİ:**
   - Tespit edilen durum hakkında kısa özet

2. **DETAYLI DEĞERLENDİRME:**
   - Güven oranının değerlendirilmesi
   - Hasta yaşı ve demografik bilgilerin etkisi
   - Semptomlarla uyumluluk analizi

3. **KLİNİK ÖNERİLER:**
   - Acil durumsa acil müdahale önerileri
   - Ek tetkik gereksinimleri
   - Takip süreci önerileri

4. **HASTA REHBERLİĞİ:**
   - Hastanın anlayacağı dilde açıklama
   - Yaşam tarzı önerileri (varsa)
   - Dikkat edilmesi gereken belirtiler

5. **KISITLAMALAR:**
   - Bu değerlendirmenin sınırları
   - Kesin tanı için gerekli adımlar

**ÖNEMLİ:** 
- Türkçe yanıt ver
- Tıbbi terminolojiyi gerektiğinde açıkla
- Hastayı korkutmadan ama ciddi durumları vurgulayarak yaz
- Kesinlikle teşhis koymadığını, sadece AI analizi yorumladığını belirt
- Mutlaka uzman doktor görüşü alınması gerektiğini vurgula

Lütfen yukarıdaki formata uygun detaylı bir tıbbi yorum hazırla:`;
  }

  /**
   * Generate disease information and recommendations
   * @param {string} diseaseName - Name of the detected condition
   * @param {Object} patientInfo - Patient information
   * @returns {Promise<Object>} Disease information and recommendations
   */
  async generateDiseaseInfo(diseaseName, patientInfo = {}) {
    if (!this.isInitialized) {
      return {
        success: false,
        message: 'Gemini AI not initialized'
      };
    }

    try {
      const prompt = `Sen bir tıp uzmanısın. "${diseaseName}" hastalığı hakkında aşağıdaki hasta profili için detaylı bilgi ver:

**HASTA PROFİLİ:**
- Yaş: ${patientInfo.age || 'Belirtilmemiş'}
- Kilo: ${patientInfo.weight || 'Belirtilmemiş'} kg
- Cinsiyet: ${patientInfo.gender || 'Belirtilmemiş'}

**İSTENEN BİLGİLER:**

1. **HASTALIK HAKKINDA:**
   - Hastalığın tanımı ve nedenleri
   - Bu yaş grubu için risk faktörleri
   - Tipik semptomlar

2. **TEDAVİ SEÇENEKLERİ:**
   - Standart tedavi yaklaşımları
   - Bu hasta profili için özel öneriler
   - Tedavi süreci ve beklentiler

3. **YAŞAM TARZI ÖNERİLERİ:**
   - Beslenme önerileri
   - Egzersiz ve aktivite önerileri
   - Kaçınılması gereken faktörler

4. **TAKİP VE KONTROL:**
   - Ne sıklıkta kontrol gerekli
   - Hangi testler yapılmalı
   - Uyarı belirtileri

5. **PROGNOZ:**
   - Hastalığın seyri hakkında genel bilgi
   - İyileşme beklentileri

Lütfen Türkçe, anlaşılır ve bilgilendirici bir yanıt hazırla. Hastayı korkutmadan ama gerçekçi bilgiler ver.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const diseaseInfo = response.text();

      return {
        success: true,
        diseaseInfo: diseaseInfo,
        diseaseName: diseaseName,
        generatedAt: new Date().toISOString(),
        model: 'gemini-1.5-flash'
      };

    } catch (error) {
      console.error('Gemini disease info generation error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Generate personalized health recommendations
   * @param {Object} patientData - Complete patient data including predictions
   * @returns {Promise<Object>} Personalized recommendations
   */
  async generateHealthRecommendations(patientData) {
    if (!this.isInitialized) {
      return {
        success: false,
        message: 'Gemini AI not initialized'
      };
    }

    try {
      const prompt = `Sen bir aile hekimi asistanısın. Aşağıdaki hasta verileri için kişiselleştirilmiş sağlık önerileri hazırla:

**HASTA VERİLERİ:**
${JSON.stringify(patientData, null, 2)}

**HAZIRLANACAK ÖNERİLER:**

1. **GENEL SAĞLIK ÖNERİLERİ:**
   - Bu yaş ve profil için genel öneriler
   - Koruyucu sağlık önlemleri

2. **BESLENME PLANI:**
   - Önerilen besinler
   - Kaçınılması gereken yiyecekler
   - Porsiyon önerileri

3. **EGZERSİZ PROGRAMI:**
   - Uygun egzersiz türleri
   - Süre ve sıklık önerileri
   - Dikkat edilecek noktalar

4. **YAŞAM TARZI:**
   - Uyku düzeni önerileri
   - Stres yönetimi
   - Zararlı alışkanlıklardan kaçınma

5. **TAKİP TAKVİMİ:**
   - Düzenli kontroller
   - Önerilen testler
   - Aşı takvimleri (yaşa uygun)

Türkçe, kişiselleştirilmiş ve uygulanabilir öneriler ver.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const recommendations = response.text();

      return {
        success: true,
        recommendations: recommendations,
        generatedAt: new Date().toISOString(),
        model: 'gemini-1.5-flash'
      };

    } catch (error) {
      console.error('Gemini recommendations generation error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Health check for Gemini AI service
   * @returns {Promise<Object>} Service status
   */
  async healthCheck() {
    if (!this.isInitialized) {
      return {
        status: 'disabled',
        message: 'Gemini AI not configured'
      };
    }

    try {
      const testPrompt = "Merhaba, bu bir test mesajıdır.";
      const result = await this.model.generateContent(testPrompt);
      const response = await result.response;
      
      if (response.text()) {
        return {
          status: 'healthy',
          message: 'Gemini AI service is working'
        };
      } else {
        return {
          status: 'error',
          message: 'No response from Gemini AI'
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }
}

// Singleton instance
const geminiService = new GeminiService();

module.exports = geminiService;
