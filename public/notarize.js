require("dotenv").config();
const { notarize } = require("@electron/notarize");

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  const appName = context.packager.appInfo.productFilename;

  if (electronPlatformName !== "darwin") {
    return;
  }

  try {
    await notarize({
      appBundleId: "com.devservices.mrxbet",
      appPath: `${appOutDir}/${appName}.app`,
      appleId: "test.wecode.inc@gmail.com",
      appleIdPassword: "frmb-fxzz-lkmt-suxc",
      teamId: "G6G549CHCQ",
    });
    console.log("Notarization successful!");
  } catch (error) {
    console.error("Notarization failed:", error);
  }
};
