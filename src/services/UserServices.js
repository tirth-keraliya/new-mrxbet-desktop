import {
  API_URL,
  CONTENT_ACCESS_TOKEN,
  CONTENT_API_URL,
  CONTENT_COLLECTION_NAME,
  CONTENT_COLLECTION_NAME_TRANSLATIONS,
  CONTENT_SPACE_ID,
  defaultTranslation,
  LEVELS_BY_ICON_NAME,
  PRODUCT_ID,
} from "../utils/helper.js";
import {
  getAppLocale,
  getCurrentPlayer,
  setAppLocale,
  setCurrentPlayer,
} from "../utils/localStorage.js";

// Assuming you have a way to change the favicon or icon in the browser.
const updateIconBasedOnLevel = async (levelName) => {
  try {
    const currentIcon = document.querySelector("link[rel='icon']");
    const currentIconHref = currentIcon ? currentIcon.href : null;

    if (LEVELS_BY_ICON_NAME[currentIconHref] === levelName) return;

    switch (levelName) {
      case "777":
        // currentIcon.href = "/public/images/777.ico";
        window.electronAPI.changeIcon("777");
        break;
      case "Black":
        // currentIcon.href = "/public/images/black.ico";
        window.electronAPI.changeIcon("black");
        break;
      case "Diamond":
        // currentIcon.href = "/public/images/diamond.ico";
        window.electronAPI.changeIcon("diamond");
        break;
      case "Gold":
        // currentIcon.href = "/public/images/gold.ico";
        window.electronAPI.changeIcon("gold");
        break;
      case "Platinum":
        // currentIcon.href = "/public/images/platinum.ico";
        window.electronAPI.changeIcon("platinum");
        break;
      case "Ruby":
        // currentIcon.href = "/public/images/ruby.ico";
        window.electronAPI.changeIcon("ruby");
      case "Silver":
        // currentIcon.href = "/public/images/silver.ico";
        window.electronAPI.changeIcon("silver");
        break;
      default:
        break;
    }
  } catch (error) {
    console.log("error", error);
  }
};

/**
 * @desc Get Player By Email
 * @param {*} email // Accepts string
 */
export const getPlayerByEmail = async (email) => {
  try {
    const response = await fetch(`${API_URL}/${PRODUCT_ID}/email/${email}`);
    const responseData = await response.json();

    if (responseData?.playerID) {
      await setCurrentPlayer({ email, ...responseData });
      await updateIconBasedOnLevel(responseData?.levelName);
      return responseData;
    } else {
      throw new Error(responseData?.message || "Login Failed!"); // Throw an error with the message
    }
  } catch (e) {
    console.log("Error : ", e);
    throw e; // Rethrow the error to be handled in onPressLogin
  }
};

/**
 * @desc Get Player By player Id
 * @param {*} playerId // Accepts string
 */
export const getPlayerByPlayerID = async (playerId) => {
  try {
    let data = false;
    await fetch(`${API_URL}/${PRODUCT_ID}/id/${playerId}`)
      .then((res) => res.json())
      .then(async (responseData) => {
        if (responseData?.playerID) {
          await setCurrentPlayer(responseData);
          await updateIconBasedOnLevel(responseData?.levelName);
          data = responseData;
        } else {
          data = false;
        }
      })
      .catch(() => {
        data = false;
      });
    return data;
  } catch (e) {
    console.log("Error : ", e);
    return false;
  }
};

/**
 * @desc Get active URLs from Contentful
 */
export const getContentfulActiveURLS = async () => {
  try {
    const language = await getAppLocale();
    const locale = language || "enUS";
    const player = await getCurrentPlayer();

    const response = await fetch(
      `${CONTENT_API_URL}/spaces/${CONTENT_SPACE_ID}/environments/master/entries?content_type=${CONTENT_COLLECTION_NAME}&access_token=${CONTENT_ACCESS_TOKEN}&limit=100`
    );

    if (!response.ok) {
      console.error("Error fetching Contentful data:", response.statusText);
      return false;
    }

    const responseData = await response.json();

    if (responseData?.sys?.type === "Error") {
      return false;
    }

    // Filter items based on player level
    const items = responseData?.items?.filter((item) =>
      item?.fields?.level?.includes(player?.levelName)
    );

    // Map items to include image URLs and clean up localized fields
    const newData = items?.map((item) => {
      const fields = item?.fields || {};
      const transformedFields = {};

      // Handle localization and cleanup
      Object.keys(fields).forEach((key) => {
        if (key.endsWith(`00${locale}`)) {
          // Localized field: strip "00<locale>" suffix
          const baseKey = key.replace(`00${locale}`, "");
          transformedFields[baseKey] = fields[key];
        } else if (
          !Object.keys(fields).some(
            (localizedKey) => localizedKey === `${key}00${locale}`
          )
        ) {
          // Add default field only if no localized version exists
          transformedFields[key] = fields[key];
        }
      });

      // Attach image data
      const imageData = responseData?.includes?.Asset?.find(
        (asset) => asset?.sys?.id === transformedFields?.image?.sys?.id
      );

      const image = imageData ? `https:${imageData?.fields?.file?.url}` : null;

      return { ...transformedFields, image };
    });

    return newData || false;
  } catch (error) {
    console.error("Error fetching Contentful Active URLs:", error);
    return false;
  }
};
export const getContentfulTranslation = async (language) => {
  try {
    // const countryCodes = await getContentfulLocation();
    const locale = language ?? "enUS";
    setAppLocale(locale);
    const response = await fetch(
      `${CONTENT_API_URL}/spaces/${CONTENT_SPACE_ID}/environments/master/entries?content_type=${CONTENT_COLLECTION_NAME_TRANSLATIONS}&access_token=${CONTENT_ACCESS_TOKEN}&limit=100`
    );
    if (!response.ok) {
      return [defaultTranslation];
    }
    const responseData = await response.json();
    if (!responseData.items || responseData.items.length === 0) {
      return [defaultTranslation]; // Return default translation if no items
    }

    const fieldsData = responseData.items.map((item) => {
      const fields = item.fields;
      const transformedFields = {};

      Object.keys(fields).forEach((key) => {
        const localeKey = `${key}00${locale}`;
        if (fields[localeKey] !== undefined) {
          // If locale-specific field exists, use it
          transformedFields[key] = fields[localeKey];
        } else {
          // Otherwise, fallback to the main field
          transformedFields[key] = fields[key];
        }
      });

      return transformedFields;
    });
    return fieldsData; // Return the array of transformed fields
  } catch (error) {
    console.error("Error fetching translations", error);
    return [defaultTranslation]; // Return an empty array in case of an error
  }
};
export const getContentfulLocation = async () => {
  try {
    const response = await fetch(
      `${CONTENT_API_URL}/spaces/${CONTENT_SPACE_ID}/environments/master/locales?access_token=${CONTENT_ACCESS_TOKEN}&limit=100`
    );
    if (!response.ok) {
      console.log(`Error fetching translations: ${response.statusText}`);
    }
    const responseData = await response.json();
    const countryCodes = responseData.items.map((item) => item.code);
    console.log(countryCodes, "extracted-codes");
    return countryCodes;
  } catch (error) {
    console.error("Error fetching translations", error);
    return ["enUS"];
  }
};
