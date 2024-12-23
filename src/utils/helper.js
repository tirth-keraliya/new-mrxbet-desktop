export const API_URL = "https://api.mypts.cc/api/PlayerLevel";

export const PRODUCT_ID = "15";

export const CONTENT_SPACE_ID = "mwgonw73cz4p";

export const CONTENT_ACCESS_TOKEN =
  "e3HGT0WVnDQHUcvJ6HFmemrEmqi4xdHrbWF-Qlk6_Ic";

export const CONTENT_COLLECTION_NAME_TRANSLATIONS = "translations";

export const CONTENT_API_URL = "https://cdn.contentful.com";

export const CONTENT_COLLECTION_NAME = "promotionList";

export const ONE_SIGNAL_APP_ID = "08ff167e-0706-4194-ae70-a0c35dd289cd";

/**
 * @desc Checks for valid email
 * @param {*} value // Accepts string
 */
export function isValidEmail(value) {
  let myRegEx =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|((?!gamil\.com$)([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  let isValid = myRegEx.test(value);
  return isValid ? true : false;
}
export const LEVELS_BY_ICON_NAME = {
  Icon1: "Ruby",
  Icon2: "Silver",
  Icon3: "Gold",
  Icon4: "Platinum",
  Icon5: "Diamond",
  Icon6: "Black",
  Icon7: "777",
};

export const defaultTranslation = {
  loginTitle: "Connect with MrXbet",
  loginDescription:
    "Enter your email associated with Mrxbet to get exclusive realtime updates and promotions specially for you!",
  emailPlaceholder: "Enter your email",
  buttonText: "Connect",
  emailRequired: "Email is required",
  validEmail: "Please enter a valid email",
  loginError: "Failed to log in. Please try again.",
  loading: "Loading....",
};
