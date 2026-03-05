let executionEnabled = true;

let reason = null;

function executeOn(source = "system") {

  executionEnabled = true;
  reason = null;

  console.log(`🟢 Execução habilitada por ${source}`);

}

function executeOff(source = "system", why = "unknown") {

  executionEnabled = false;
  reason = why;

  console.log(`🔴 Execução desabilitada por ${source} (${why})`);

}

function canExecute() {

  return executionEnabled;

}

function getExecutionStatus() {

  return {
    enabled: executionEnabled,
    reason
  };

}

module.exports = {
  executeOn,
  executeOff,
  canExecute,
  getExecutionStatus
};