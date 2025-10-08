// Import all models to ensure they're registered with Mongoose
// This prevents "Schema hasn't been registered" errors
import District from './District';
import Team from './Team';
import Doctor from './Doctor';
import User from './User';
import Product from './Product';
import DistrictProduct from './DistrictProduct';
import Order from './Order';
import Patient from './Patient';
import Prescription from './Prescription';

// Export all models
export {
  District,
  Team,
  Doctor,
  User,
  Product,
  DistrictProduct,
  Order,
  Patient,
  Prescription,
};

// Helper to ensure all models are loaded
export function ensureModelsLoaded() {
  return {
    District: District.modelName,
    Team: Team.modelName,
    Doctor: Doctor.modelName,
    User: User.modelName,
    Product: Product.modelName,
    DistrictProduct: DistrictProduct.modelName,
    Order: Order.modelName,
    Patient: Patient.modelName,
    Prescription: Prescription.modelName,
  };
}

