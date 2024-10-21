import { defaultTranslation } from "./helper";

const CURRENT_PLAYER = "current_player";
const TRANSLATIONS = "translations";
const LOCALE = "locale";

export const setCurrentPlayer = (data) => {
  try {
    localStorage.setItem(CURRENT_PLAYER, JSON.stringify(data));
  } catch (error) {
    console.log(error.message);
  }
};

export const getCurrentPlayer = () => {
  try {
    const user = localStorage.getItem(CURRENT_PLAYER);
    if (user) return JSON.parse(user);
    return undefined;
  } catch (error) {
    console.log(error.message);
  }
};
export const setTranslations = (data) => {
  try {
    localStorage.setItem(TRANSLATIONS, JSON.stringify(data));
  } catch (error) {
    console.log(error.message);
  }
};

export const getTranslations = () => {
  try {
    const translation = localStorage.getItem(TRANSLATIONS);
    const transalationss = translation ? JSON.parse(translation) : [];
    if (transalationss?.length) {
      return transalationss[0];
    } else {
      return defaultTranslation;
    }
    return undefined;
  } catch (error) {
    console.log(error.message);
  }
};

export const setAppLocale = (data) => {
  try {
    localStorage.setItem(LOCALE, JSON.stringify(data));
  } catch (error) {
    console.log(error.message);
  }
};

export const getAppLocale = () => {
  try {
    const locale = localStorage.getItem(LOCALE);
    if (locale) return JSON.parse(locale);
    return undefined;
  } catch (error) {
    console.log(error.message);
  }
};

export const deleteCurrentPlayer = () => {
  try {
    localStorage.removeItem(CURRENT_PLAYER);
  } catch (error) {
    console.log(error.message);
  }
};

export const deleteAllLocalData = () => {
  try {
    localStorage.removeItem(CURRENT_PLAYER);
  } catch (error) {
    console.log(error.message);
  }
};
