const express = require('express');
const router = express.Router();
const ConsultaModel = require('../models/ConsultaModel');

// GET /api/consultas - Obtener todas las consultas con filtro opcional
router.get('/', async (req, res) => {
  try {
    const { filtro } = req.query;
    const consultas = await ConsultaModel.getAll(filtro);
    
    res.json({
      success: true,
      data: consultas,
      count: consultas.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/consultas/:id - Obtener consulta por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const consulta = await ConsultaModel.getById(id);
    
    if (!consulta) {
      return res.status(404).json({
        success: false,
        message: 'Consulta no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: consulta
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/consultas - Crear nueva consulta
router.post('/', async (req, res) => {
  try {
    const consultaData = req.body;
    
    // Validaciones básicas
    if (!consultaData.titulo || !consultaData.sql_codigo) {
      return res.status(400).json({
        success: false,
        message: 'Título y código SQL son requeridos'
      });
    }
    
    const nuevaConsulta = await ConsultaModel.create(consultaData);
    
    res.status(201).json({
      success: true,
      data: nuevaConsulta,
      message: 'Consulta creada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/consultas/:id - Actualizar consulta
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const consultaData = req.body;
    
    // Validaciones básicas
    if (!consultaData.titulo || !consultaData.sql_codigo) {
      return res.status(400).json({
        success: false,
        message: 'Título y código SQL son requeridos'
      });
    }
    
    const consultaActualizada = await ConsultaModel.update(id, consultaData);
    
    if (!consultaActualizada) {
      return res.status(404).json({
        success: false,
        message: 'Consulta no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: consultaActualizada,
      message: 'Consulta actualizada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE /api/consultas/:id - Eliminar consulta
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const eliminada = await ConsultaModel.delete(id);
    
    if (!eliminada) {
      return res.status(404).json({
        success: false,
        message: 'Consulta no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Consulta eliminada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/consultas/:id/versiones - Obtener versiones de una consulta
router.get('/:id/versiones', async (req, res) => {
  try {
    const { id } = req.params;
    const versiones = await ConsultaModel.getVersions(id);
    
    res.json({
      success: true,
      data: versiones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;