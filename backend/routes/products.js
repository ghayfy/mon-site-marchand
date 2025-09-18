import { Router } from 'express';
import { list, getOne } from '../controllers/productController.js';
const r = Router();
r.get('/', list);
r.get('/:id', getOne);
export default r;
