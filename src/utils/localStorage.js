const CURRENT_PLAYER = "current_player";

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
