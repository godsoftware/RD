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

    const maxRetries = 3;
    const baseDelay = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 Gemini AI interpretation attempt ${attempt}/${maxRetries}`);
        const prompt = this.buildMedicalPrompt(predictionData, patientInfo);
        
        // Timeout kontrolü ekle
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini AI timeout after 30 seconds')), 30000)
        );
        
        const result = await Promise.race([
          this.model.generateContent(prompt),
          timeoutPromise
        ]);
        
        const response = await result.response;
        const interpretation = response.text();
        
        // Boş response kontrolü
        if (!interpretation || interpretation.trim().length === 0) {
          throw new Error('Empty response from Gemini AI');
        }
        
        console.log('✅ Gemini AI interpretation generated successfully');
        console.log(`📝 Interpretation length: ${interpretation.length} characters`);
        
        return {
          success: true,
          interpretation: interpretation,
          originalPrediction: predictionData.medicalInterpretation,
          generatedAt: new Date().toISOString(),
          model: 'gemini-1.5-flash',
          attempts: attempt
        };

      } catch (error) {
        console.error(`❌ Gemini AI attempt ${attempt} failed:`, error.message);
        
        const isRetryableError = error.message.includes('overloaded') ||
                                error.message.includes('503') ||
                                error.message.includes('rate limit') ||
                                error.message.includes('quota') ||
                                error.message.includes('timeout') ||
                                error.message.includes('Empty response') ||
                                error.message.includes('UNAVAILABLE') ||
                                error.message.includes('INTERNAL') ||
                                error.message.includes('SERVICE_UNAVAILABLE');
        
        if (attempt < maxRetries && isRetryableError) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Waiting ${delay}ms before retry... (Error: ${error.message})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Son deneme başarısız oldu, fallback kullan
        console.error('❌ All Gemini AI attempts failed, using fallback');
        return {
          success: false,
          message: error.message,
          interpretation: this.getFallbackInterpretation(predictionData),
          originalPrediction: predictionData.medicalInterpretation,
          generatedAt: new Date().toISOString(),
          model: 'fallback',
          attempts: attempt,
          fallback: true
        };
      }
    }
  }

  /**
   * Get fallback interpretation when Gemini AI fails
   * @param {Object} predictionData - AI prediction results
   * @returns {string} Fallback medical interpretation
   */
  getFallbackInterpretation(predictionData) {
    const { modelType, prediction, confidence, isPositive } = predictionData;
    
    const fallbackTemplates = {
      pneumonia: {
        positive: `Göğüs röntgeni analizinde pnömoni bulguları tespit edilmiştir (Güven: ${confidence}%). Bu sonuç yapay zeka analizi sonucudur ve kesin tanı için uzman doktor görüşü alınmalıdır. Nefes darlığı, ateş, öksürük gibi semptomlarınız varsa hemen sağlık kuruluşuna başvurunuz.`,
        negative: `Göğüs röntgeni analizinde normal bulgular tespit edilmiştir (Güven: ${confidence}%). Ancak bu sonuç yalnızca yapay zeka analizidir. Semptomlarınız devam ediyorsa doktor kontrolü önerilir.`
      },
      brainTumor: {
        positive: `Beyin görüntülemesinde ${prediction} tespit edilmiştir (Güven: ${confidence}%). Bu durum acil tıbbi değerlendirme gerektirir. Lütfen derhal bir nöroloji uzmanına başvurunuz. Bu sonuç yapay zeka analizi olup kesin tanı için ileri tetkikler gereklidir.`,
        negative: `Beyin görüntülemesinde normal bulgular tespit edilmiştir (Güven: ${confidence}%). Ancak semptomlarınız varsa nöroloji uzmanı kontrolü önerilir.`
      },
      tuberculosis: {
        positive: `Tüberküloz bulgularına rastlanmıştır (Güven: ${confidence}%). Bu bulaşıcı bir hastalıktır ve acil tıbbi müdahale gerektirir. Lütfen derhal bir göğüs hastalıkları uzmanına başvurunuz ve çevrenizdekileri koruma önlemleri alınız.`,
        negative: `Tüberküloz bulgularına rastlanmamıştır (Güven: ${confidence}%). Ancak semptomlarınız varsa göğüs hastalıkları uzmanı kontrolü önerilir.`
      }
    };
    
    const template = fallbackTemplates[modelType];
    if (!template) {
      return `${prediction} tespit edilmiştir (Güven: ${confidence}%). Bu yapay zeka analizi sonucudur ve kesin tanı için uzman doktor görüşü alınmalıdır.`;
    }
    
    return isPositive ? template.positive : template.negative;
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

    // Model tipine göre özelleştirilmiş prompt
    const modelSpecificContext = this.getModelSpecificContext(modelType, prediction, isPositive);
    
    return `Sen bir uzman ${modelSpecificContext.specialty} doktorusun. KISA ve ÖZ bir tıbbi değerlendirme yap. MAKSIMUM 200 KELİME.

**ÖNEMLİ TERİM ANLAYIŞI:**
- "No tumor" = Tümör YOK, NORMAL
- "Normal" = Hastalık YOK, SAĞLIKLI  
- "Negative" = Hastalık Yok, NEGATİF sonuç
- "Pneumonia" = Akciğer enfeksiyonu VAR
- "Tuberculosis" = Verem hastalığı VAR

**${modelSpecificContext.title} ANALİZİ:**
- Sonuç: ${prediction} (${confidence}% güven)
- Durum: ${isPositive ? 'POZİTİF (Hastalık Var)' : 'NEGATİF (Normal/Sağlıklı)'}
${age ? `- Yaş: ${age}` : ''}
${symptoms ? `- Semptomlar: ${symptoms}` : ''}

**UZMANLIK DEĞERLENDİRMESİ (MAKSIMUM 200 KELİME):**

**1. ${modelSpecificContext.resultLabel}:** ${prediction} ${isPositive ? 'tespit edildi' : 'tespit edilmedi (Normal)'} (%${confidence} güven).

**2. KLİNİK ANLAM:** ${modelSpecificContext.clinicalMeaning}

**3. ACİLİYET:** ${modelSpecificContext.urgencyNote}

**4. TAVSİYE:** ${modelSpecificContext.recommendation}

**5. UYARI:** Bu AI analizi. Mutlaka ${modelSpecificContext.specialty} kontrolü gerekli.

KISA VE ÖZ YANIT VER. TERİMLERİ DOĞRU ANLA. TÜRKÇE YANIT VER. MAKSIMUM 200 KELİME.`;
  }

  /**
   * Get model-specific medical context
   * @param {string} modelType - Model type (pneumonia, brainTumor, tuberculosis)
   * @param {string} prediction - Prediction result
   * @param {boolean} isPositive - Whether result is positive
   * @returns {Object} Model-specific context
   */
  getModelSpecificContext(modelType, prediction, isPositive) {
    const contexts = {
      pneumonia: {
        specialty: 'Göğüs Hastalıkları',
        title: 'AKCIĞER X-RAY',
        resultLabel: 'PNÖMONİ TANISI',
        clinicalMeaning: isPositive 
          ? 'Akciğerde enfeksiyon belirtileri mevcut. Tedavi gerekli.'
          : 'Akciğer görünümü normal. Pnömoni belirtisi yok.',
        urgencyNote: isPositive 
          ? 'Orta aciliyet. 24 saat içinde doktor kontrolü.'
          : 'Rutin kontrol yeterli.',
        recommendation: isPositive 
          ? 'Antibiyotik tedavisi ve dinlenme gerekebilir.'
          : 'Mevcut sağlık durumu korunmalı.'
      },
      brainTumor: {
        specialty: 'Beyin ve Sinir Cerrahisi',
        title: 'BEYİN MR/BT',
        resultLabel: 'BEYİN TÜMÖRÜ TANISI',
        clinicalMeaning: isPositive 
          ? 'Beyin dokusunda anormal yapı tespit edildi. Detaylı inceleme gerekli.'
          : 'Beyin görüntülemesi normal. Tümör belirtisi yok.',
        urgencyNote: isPositive 
          ? 'YÜKSEK ACİLİYET! Derhal nöroloji/beyin cerrahisi konsültasyonu.'
          : 'Rutin kontrol yeterli.',
        recommendation: isPositive 
          ? 'İleri görüntüleme ve biyopsi değerlendirmesi gerekli.'
          : 'Düzenli sağlık kontrolü sürdürülmeli.'
      },
      tuberculosis: {
        specialty: 'Enfeksiyon Hastalıkları',
        title: 'TÜBERKÜLOZ TARAMA',
        resultLabel: 'TÜBERKÜLOZ TANISI',
        clinicalMeaning: isPositive 
          ? 'Tüberküloz belirtileri mevcut. Hemen tedavi başlanmalı.'
          : 'Tüberküloz belirtisi yok. Akciğer sağlıklı.',
        urgencyNote: isPositive 
          ? 'YÜKSEK ACİLİYET! Bulaşıcı hastalık. İzolasyon gerekli.'
          : 'Rutin kontrol yeterli.',
        recommendation: isPositive 
          ? 'Anti-TB tedavi ve temas takibi başlatılmalı.'
          : 'Koruyucu önlemler sürdürülmeli.'
      }
    };

    return contexts[modelType] || contexts.pneumonia; // Default to pneumonia if unknown
  }
  
  // Eski uzun prompt - artık kullanılmıyor
  buildOldMedicalPrompt(predictionData, patientInfo) {
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

    return `**GÖRÜNTÜ ANALİZİ SONUÇLARI:**
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
      const prompt = `Sen bir tıp uzmanısın. "${diseaseName}" hakkında bilgi ver. MUTLAKA 500 KELİMEYİ GEÇMEYECEKSİN.

Hasta: ${patientInfo.age || 'Bilinmiyor'} yaş, ${patientInfo.gender || 'Belirtilmemiş'} cinsiyet.

ÖZET BİLGİ VER (MAKSİMUM 500 KELİME):

1. HASTALIK HAKKINDA (100 kelime):
Hastalığın tanımı, nedenleri ve tipik belirtileri.

2. TEDAVİ (100 kelime):
Standart tedavi yaklaşımları ve süreç.

3. YAŞAM TARZI ÖNERİLERİ (100 kelime):
Beslenme, egzersiz ve kaçınılması gerekenler.

4. TAKİP VE KONTROL (100 kelime):
Kontrol sıklığı, gerekli testler ve uyarı işaretleri.

5. PROGNOZ (100 kelime):
Hastalığın seyri ve iyileşme beklentileri.

TÜRKÇE YAZ. Başlık kullanma, sadece düz metin. Noktalama işareti kullan. 500 kelimeyi kesinlikle geçme.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let diseaseInfo = response.text();
      
      // Remove any ** formatting and clean up
      diseaseInfo = diseaseInfo.replace(/\*\*/g, '');
      diseaseInfo = diseaseInfo.replace(/\n{3,}/g, '\n\n'); // Replace multiple newlines with double
      
      // Truncate to approximately 500 words if needed
      const words = diseaseInfo.split(/\s+/);
      if (words.length > 500) {
        diseaseInfo = words.slice(0, 500).join(' ') + '...';
      }

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
