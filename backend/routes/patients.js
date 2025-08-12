const express = require('express');
const router = express.Router();
const { firebaseAuth } = require('../middleware/firebaseAuth');
const firebaseService = require('../services/firebaseService');
const { validationResult, body } = require('express-validator');

// Validation middleware
const patientValidation = [
  body('name').trim().notEmpty().withMessage('Patient name is required'),
  body('age').isInt({ min: 0, max: 120 }).withMessage('Valid age is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
  body('contactInfo.email').optional().isEmail().withMessage('Valid email is required'),
  body('contactInfo.phone').optional().isMobilePhone().withMessage('Valid phone number is required')
];

// Get all patients for the authenticated user
router.get('/', firebaseAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const patients = await firebaseService.getPatientsByUserId(userId);
    
    res.json({
      success: true,
      data: patients
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve patients'
    });
  }
});

// Get patient by ID
router.get('/:id', firebaseAuth, async (req, res) => {
  try {
    const patientId = req.params.id;
    const userId = req.user.uid;
    
    const patient = await firebaseService.getPatientById(patientId);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Check if patient belongs to authenticated user
    if (patient.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve patient'
    });
  }
});

// Create new patient
router.post('/', firebaseAuth, patientValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const userId = req.user.uid;
    const patientData = {
      ...req.body,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const patientId = await firebaseService.createPatient(patientData);
    const patient = await firebaseService.getPatientById(patientId);
    
    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: patient
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create patient'
    });
  }
});

// Update patient
router.put('/:id', firebaseAuth, patientValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const patientId = req.params.id;
    const userId = req.user.uid;
    
    // Check if patient exists and belongs to user
    const existingPatient = await firebaseService.getPatientById(patientId);
    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    if (existingPatient.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    await firebaseService.updatePatient(patientId, updateData);
    const updatedPatient = await firebaseService.getPatientById(patientId);
    
    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: updatedPatient
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update patient'
    });
  }
});

// Delete patient
router.delete('/:id', firebaseAuth, async (req, res) => {
  try {
    const patientId = req.params.id;
    const userId = req.user.uid;
    
    // Check if patient exists and belongs to user
    const existingPatient = await firebaseService.getPatientById(patientId);
    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    if (existingPatient.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    await firebaseService.deletePatient(patientId);
    
    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete patient'
    });
  }
});

// Get patient's prediction history
router.get('/:id/predictions', firebaseAuth, async (req, res) => {
  try {
    const patientId = req.params.id;
    const userId = req.user.uid;
    
    // Check if patient exists and belongs to user
    const patient = await firebaseService.getPatientById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    if (patient.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const predictions = await firebaseService.getPredictionsByPatientId(patientId);
    
    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    console.error('Get patient predictions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve patient predictions'
    });
  }
});

module.exports = router;
