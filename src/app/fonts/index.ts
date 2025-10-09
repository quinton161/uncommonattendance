// Import the Chillax CSS font-face declarations
import './chillax.css'

// Export font configuration objects for compatibility
export const chillaxSemiBold = {
  variable: '--font-chillax-semibold',
  className: 'font-chillax-semibold'
}

export const chillaxRegular = {
  variable: '--font-chillax-regular', 
  className: 'font-chillax-regular'
}

// Keep the old export name for compatibility
export const avenirNextRegular = chillaxRegular
