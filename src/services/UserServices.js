import { getCurrentPlayer, setCurrentPlayer } from "../utils/localStorage.js";
import {
  API_URL,
  CONTENT_ACCESS_TOKEN,
  CONTENT_API_URL,
  CONTENT_COLLECTION_NAME,
  CONTENT_COLLECTION_NAME_TRANSLATIONS,
  CONTENT_SPACE_ID,
  LEVELS_BY_ICON_NAME,
  PRODUCT_ID,
} from "../utils/helper.js";

// Assuming you have a way to change the favicon or icon in the browser.
const updateIconBasedOnLevel = async (levelName) => {
  try {
    const currentIcon = document.querySelector("link[rel='icon']");
    const currentIconHref = currentIcon ? currentIcon.href : null;

    if (LEVELS_BY_ICON_NAME[currentIconHref] === levelName) return;

    switch (levelName) {
      case "Platinum":
        // currentIcon.href = "/public/images/platinum.ico";
        window.electronAPI.changeIcon("platinum");
        break;
      case "Silver":
        // currentIcon.href = "/public/images/bronze.ico";
        window.electronAPI.changeIcon("bronze");
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
    let data = false;
    await fetch(
      `${CONTENT_API_URL}/spaces/${CONTENT_SPACE_ID}/environments/master/entries?content_type=${CONTENT_COLLECTION_NAME}&access_token=${CONTENT_ACCESS_TOKEN}&limit=100`
    )
      .then((res) => res.json())
      .then(async (responseData) => {
        let player = await getCurrentPlayer();
        if (responseData?.sys?.type === "Error") {
          data = false;
        } else {
          const items = await responseData?.items?.filter((item) =>
            item?.fields?.level?.includes(player?.levelName)
          );
          const newData = await items?.map((item) => {
            const imageData = responseData?.includes?.Asset?.find(
              (asset) => asset?.sys?.id === item?.fields?.image?.sys?.id
            );

            let image = `https:${imageData?.fields?.file?.url}`;

            return { ...item?.fields, image };
          });

          data = newData;
        }
      })
      .catch((err) => {
        console.log("err", err);
      });
    return data;
  } catch (error) {
    console.error("Error fetching", error);
    throw error;
  }
};
export const getContentfulTranslation = async (locale) => {
  try {
    const response = await fetch(
      `${CONTENT_API_URL}/spaces/${CONTENT_SPACE_ID}/environments/master/entries?content_type=${CONTENT_COLLECTION_NAME_TRANSLATIONS}&access_token=${CONTENT_ACCESS_TOKEN}&limit=100&locale=${locale}`
    );

    if (!response.ok) {
      throw new Error(`Error fetching translations: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log(responseData, "responseData----ttt");

    // Check if the response data contains items

    // Extract fields data from items
    const fieldsData = responseData.items.map((item) => item.fields);
    console.log(fieldsData, "fieldssssssss");

    return fieldsData; // Return the array of fields data
  } catch (error) {
    console.error("Error fetching translations", error);
    return []; // Return an empty array in case of an error
  }
};
export const getContentfulLocation = async () => {
  try {
    const response = await fetch(
      `${CONTENT_API_URL}/spaces/${CONTENT_SPACE_ID}/environments/master/locales?access_token=${CONTENT_ACCESS_TOKEN}&limit=100`
    );

    if (!response.ok) {
      throw new Error(`Error fetching translations: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log(responseData, "data-test-test");

    // Extract the code from each item
    const countryCodes = responseData.items.map((item) => item.code);

    console.log(countryCodes, "extracted-codes"); // Log extracted codes

    return countryCodes; // Return the array of codes
  } catch (error) {
    console.error("Error fetching translations", error);
    return []; // Return an empty array in case of an error
  }
};
