import { AppsManager } from '../../../modules/apps/index.v2';
import { ERROR_TYPES, ErrorManager } from '../../../common/errors';

export function* exportApp() {
  const appId = this.params.appId;
  const options = extractOptions(this.request.query);
  try {
    this.body = yield AppsManager.export(appId, options);
  } catch (error) {
    handleErrorAndRethrow(error);
  }
}

function handleErrorAndRethrow(error) {
  if (!error.isOperational) {
    throw error;
  }
  if (error.type === ERROR_TYPES.COMMON.VALIDATION) {
    throw ErrorManager.createRestError('Validation error in /apps getApp', {
      status: 400,
      title: 'Validation error',
      detail: 'There were one or more validation problems',
      meta: error.details.errors,
    });
  } else if (error.type === ERROR_TYPES.COMMON.NOT_FOUND) {
    throw ErrorManager.createRestNotFoundError('Application not found', {
      title: 'Application not found',
      detail: 'No application with the specified id',
    });
  } else if (error.type === ERROR_TYPES.COMMON.HAS_SUBFLOW) {
    throw ErrorManager.createRestError('Application cannot be exported', {
      title: 'Application cannot be exported',
      detail: 'Application with subflow tasks cannot be exported',
      code: ERROR_TYPES.COMMON.HAS_SUBFLOW,
    });
  }
  throw error;
}

function extractOptions(queryParams) {
  const {
    appmodel,
    type,
    flowids: flowIdsCsv,
  } = queryParams;
  const flowIds = flowIdsCsv ? flowIdsCsv.split(',') : null;
  return {
    appModel: appmodel,
    format: type,
    flowIds,
  };
}