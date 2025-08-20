import express from 'express';
import { 
  uploadFiles, 
  createVehicleFiles, 
  getVehicleFiles, 
  getVehicleFileById, 
  updateVehicleFiles, 
  deleteVehicleFiles 
} from '../controllers/vehicleFilesController.js';

const router = express.Router();

router.post('/', uploadFiles, createVehicleFiles);
router.get('/', getVehicleFiles);
router.get('/:id', getVehicleFileById);
router.put('/:id', uploadFiles, updateVehicleFiles);
router.delete('/:id', deleteVehicleFiles);

export default router;
