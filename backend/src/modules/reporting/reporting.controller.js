'use strict';

const reportingService = require('./reporting.service');
const ApiResponse = require('../../utils/ApiResponse');

const overview = async (req, res, next) => {
  try {
    const data = await reportingService.getOverview(req.user);
    return ApiResponse.success(res, data, 'Overview KPIs');
  } catch (error) {
    return next(error);
  }
};

const projectStats = async (req, res, next) => {
  try {
    const data = await reportingService.getProjectStats(req.user);
    return ApiResponse.success(res, data, 'Project stats');
  } catch (error) {
    return next(error);
  }
};

const userStats = async (req, res, next) => {
  try {
    const data = await reportingService.getUserStats();
    return ApiResponse.success(res, data, 'User stats');
  } catch (error) {
    return next(error);
  }
};

const publicationStats = async (req, res, next) => {
  try {
    const data = await reportingService.getPublicationStats(req.user);
    return ApiResponse.success(res, data, 'Publication stats');
  } catch (error) {
    return next(error);
  }
};

const validationStats = async (req, res, next) => {
  try {
    const data = await reportingService.getValidationStats(req.user);
    return ApiResponse.success(res, data, 'Validation stats');
  } catch (error) {
    return next(error);
  }
};

const exportPdf = async (req, res, next) => {
  try {
    // Placeholder — full PDF export will use pdfkit
    const overview = await reportingService.getOverview(req.user);
    res.setHeader('Content-Type', 'application/json');
    return ApiResponse.success(res, overview, 'PDF export placeholder — implement with pdfkit');
  } catch (error) {
    return next(error);
  }
};

const exportExcel = async (req, res, next) => {
  try {
    // Placeholder — full Excel export will use exceljs
    const overview = await reportingService.getOverview(req.user);
    res.setHeader('Content-Type', 'application/json');
    return ApiResponse.success(res, overview, 'Excel export placeholder — implement with exceljs');
  } catch (error) {
    return next(error);
  }
};

module.exports = { overview, projectStats, userStats, publicationStats, validationStats, exportPdf, exportExcel };
