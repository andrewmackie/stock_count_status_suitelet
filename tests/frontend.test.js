const criterionMatchesSKU = require('../src/FileCabinet/SuiteScripts/stocktake_reporting_suitelet/asm_stocktake_reporting.html');

const criterionCMS = {}

const skuCMS = [{
  upccode: "9789712909214",
  title: "GNB Gnt Compact Catholic Youth Edition With Deuterocanonicals",
  classification: "C",
  qty: {
    perCarton: 40,
    shipment: 600,
    alreadyDispatched: 0,
    shipmentRemaining: 600,
    numberOfCartons: 15,
    spareUnits: 0
  }]
}

test('adds 1 + 2 to equal 3', () => {
  expect(criterionMatchesSKU(criterionCMS, skuCMS[0])).toBe(3);
});