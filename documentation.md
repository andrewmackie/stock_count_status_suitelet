# EPTO Suitelet
Andrew Mackie, andrew.mackie@bsa.org.au (Bible Society Australia)

## Purpose
This suitelet is for Koorong's Erskine Park (EP) warehouse, for bench workers as they:
- break down pallets from inbound shipments, and
- send Transfer Orders (TOs) to stores (from stock which has been pulled out of EP Bins).


## Goals
### Speed
This suitelet is intended to create the fastest possible method for bench workers to identify how to distribute stock of a particular SKU and create perform necessary operations in NetSuite. 

Speed at EP is more important than receiving speed at stores, but the end-to-end process has been considered.

replaces many RF-SMART operations. Temporarily halting RF-SMART Inventory Transfers for Transfer Orders at EP doubled the throughput of the warehouse.

### Usability




## Functionality
The bench worker starts by selecting a 


## Cases to Handle
- Someone changing Shipping Document mid-SKU (check whether they actually want to change?)
  - It's not just that SKU, it's also those which have been submitted before it)
- Error states
  - Invalid bin
  - Invalid bench ID




## Input Queries
Inbound Search for SKU
Quantity already distributed:
- EPTO Distribution Records
- Joel's Excel Spreadsheets (if new IB Shipments cannot be started)



## Output Records
Initially:
1. Inventory Transfer for X units to EP For Sale  (BO + PA)
2. Inventory Transfer for Y units to EP In Transit (to stores)
3. EPTO Distribution Record (with references to both inventory transfers, ideally)

For Supply Allocation:
4. [How do we complete / trigger Supply Allocation so that it commits?]
5. [Can I read the supply allocation before committing it?]

In the future:
1. Partially fulfilling a TO

Ideal case in the future:
1. Allocating stock to a carton ID (which may represent several cartons)
2. Allocating Pallet ID (which will have many cartons)
