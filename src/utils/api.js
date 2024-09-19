export const fetchActiveURL = async () => {
  const API_URL = "https://cdn.contentful.com";
  const SPACE_ID = "1igtcus6456h";
  const ACCESS_TOKEN = "JaSKyZvZwu4uByhPQc-p8MPRLUPLep-Dyk5hAkYz_tw";
  const COLLECTION_NAME = "active-urls";
  try {
    const response = await fetch(
      `${API_URL}/spaces/${SPACE_ID}/environments/master/entries?content_type=${COLLECTION_NAME}&access_token=${ACCESS_TOKEN}&limit=100`
    );
    const responseData = await response.json();
    console.log(responseData, "asdas");
    const items = responseData.items.map((item) => item.fields);
    const splashImage = responseData.includes.Asset[0].fields.file.url;
    console.log("Data from API:", responseData.includes.Asset[0].fields);
    return { items, splashImage };
  } catch (error) {
    console.error("Error fetching data from API:", error);
    throw error;
  }
};
