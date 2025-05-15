const codeMap = require('../dict').response;

const returnSuccess = (res, data) => {
    return res.json({
        code: codeMap.commonSuccess,
        result: data
    });
};

const returnError = (res, err) => {
    return res.json({
        code: codeMap.commonError,
        error: err
    });
};

const returnSystemError = (res) => {
    return res.json({
        code: codeMap.systemError,
        error: 'System Error.'
    });
};

const returnParamError = (res) => {
    return res.json({
        code: codeMap.paramError,
        error: 'Param Error.'
    });
};

const returnReloginError = (res) => {
    return res.json({
        code: codeMap.relogin,
        error: 'please relogin.'
    });
};

const returnPermissionError = (res) => {
    return res.json({
        code: codeMap.permissionError,
        error: 'Permission error.'
    });
};

const returnAuthError = res => {
    return res.json({
        code: codeMap.authError,
        error: 'Authentication failed.'
    });
};

module.exports = {
    returnSuccess,
    returnError,
    returnSystemError,
    returnParamError,
    returnReloginError,
    returnPermissionError,
    returnAuthError
};
