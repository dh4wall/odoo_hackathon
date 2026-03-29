import axios from "axios";

/**
 * Fetches the primary currency code for a given ISO 3166-1 alpha-2 country code.
 * e.g. "IN" → "INR", "US" → "USD", "GB" → "GBP"
 */
export const getCurrencyForCountry = async (
  countryCode: string
): Promise<string> => {
  try {
    const response = await axios.get(
      `https://restcountries.com/v3.1/alpha/${countryCode.toUpperCase()}?fields=currencies`,
      { timeout: 5000 }
    );

    const currencies: Record<string, { name: string; symbol: string }> =
      response.data?.currencies;

    if (!currencies || Object.keys(currencies).length === 0) {
      throw new Error(`No currency data found for country code: ${countryCode}`);
    }

    // Return the first currency code (e.g., "INR")
    return Object.keys(currencies)[0];
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error(`Invalid country code: ${countryCode}`);
    }
    throw new Error(
      `Failed to fetch currency for country ${countryCode}: ${error.message}`
    );
  }
};
