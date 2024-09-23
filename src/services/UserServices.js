import { getCurrentPlayer, setCurrentPlayer } from "../utils/localStorage.js";
import {
  API_URL,
  CONTENT_ACCESS_TOKEN,
  CONTENT_API_URL,
  CONTENT_COLLECTION_NAME,
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
