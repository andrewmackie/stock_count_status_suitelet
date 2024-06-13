/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(
    ['N/ui/serverWidget', 'N/file', 'N/http', 'N/url', 'N/search', 'N/log', 'N/util', 'N/format'],
    function(serverWidget, file, http, url, search, log, util, format) {

        function onRequest(context) {
            log.debug({title: 'Entered onRequest', details: context.request.parameters})
            try {
                if (context.request.method === 'GET') {
                    const requestType = context.request.parameters.requestType;
                    if (requestType === 'locations') {
                        writeData(context, getLocations());
                    } else if (requestType === 'headers') {
                        const locationId = context.request.parameters.locationId;
                        writeData(context, getStockCountHeaders(locationId));
                    } else if (requestType === 'details') {
                        const countId = context.request.parameters.countId;
                        writeData(context, getStockCountDetails(countId));
                    } else if (requestType === 'sections') {
                        const countIdArr = decodeURIComponent(context.request.parameters.countIds);
                        writeData(context, getStockCountSections(countIdArr));
                    } else {
                        // return asm_stocktake_reporting.html
                        const fileId = '3383020' // TODO - Fix hardcoded fileId
                        const vueAppFile = file.load({id: fileId});
                        context.response.setHeader({name: 'Content-Type', value: 'text/html'});
                        context.response.write({output: vueAppFile.getContents()});
                    }
                }
            } catch (error) {
                log.error({title: 'onRequest error: '.concat(error.name), details: error.message})

            }
        }


        function writeData(context, data) {
            /* Convert server data to JSON response */
            try {
                context.response.setHeader({name: 'Content-Type', value: 'application/json'});
                context.response.write({output: JSON.stringify(data)});
            } catch (error) {
                log.error({title: 'writeData error: '.concat(error.name), details: error.message})

            }
        }

        function getLocations() {
            const locationSearchObj = search.create({
                type: "location",
                filters: [],
                columns:
                    [
                        search.createColumn({name: "internalid", label: "ID"}),
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                    ]
            });
            const searchResultCount = locationSearchObj.runPaged().count;
            log.debug("locationSearchObj result count", searchResultCount);
            // List for vuetify v-autocomplete
            const locationList = [];
            // Object with id as key and name as value
            const locationsById = {};
            // Object with name as key and id as value
            const locationsByName = {};
            const ignoreWords = ['faulty', 'cafe', 'specific', 'head', 'office', 'bsa', 'rex', 'express', 'to process', 'cpx']
            locationSearchObj.run().each(function (result) {
                const name = result.getValue('Name')
                const id = result.getValue('internalid')
                let includeLocation = true
                ignoreWords.forEach((searchStr) => {
                    if (name.toLowerCase().includes(searchStr)) {
                        includeLocation = false
                    }
                })
                if (includeLocation) {
                    locationList.push({title: name, value: id});
                    locationsById[id] = name;
                    locationsByName[name] = id;
                }
                return true;
            });
            return {
                locationList,
                locationsById,
                locationsByName
            }
        }

        const rfSmartStatus = ['', 'Open', 'Started', 'Complete', 'Closed', 'Processing', 'Queued']

        function getStockCountHeaders(locationId) {
            let filters = []
            if (locationId) {
                filters = [
                    ["custrecord_rfs_physicalcount_location", "anyof", locationId]
                ]
            }
            log.debug({title: 'getStockCount Filters', details: filters})
            const stockCountHeadersSearchObj = search.create({
                type: "customrecord_rfs_physicalcountheader",
                filters: filters,
                columns:
                    [
                        search.createColumn({
                            name: "id",
                            sort: search.Sort.ASC,
                            label: "id" // Header row ID
                        }),
                        search.createColumn({name: "custrecord_rfs_physicalcount_name", label: "name"}),
                        search.createColumn({name: "custrecord_rfs_physicalcount_countstatus", label: "status"}),
                        /*search.createColumn({
                            name: "custrecord_rfs_include_fulfillment_qty",
                            label: "Include Item Fulfillment Quantities in Count"
                        }), */
                        search.createColumn({
                            name: "custrecord_rfs_physicalcount_itmcntgrps",
                            label: "iCountGroups" // Item Counting Groups
                        }),
                        search.createColumn({
                            name: "custrecord_rfs_physicalcount_bncntgrps",
                            label: "bCountGroups" // Bin Counting Groups
                        }),
                        search.createColumn({
                            name: "custrecord_rfs_physicalcount_itmsvdsrch",
                            label: "iSavedSearch" // Item Saved Search
                        }),
                        search.createColumn({
                            name: "custrecord_rfs_count_koorong_retailshop",
                            label: "isRetailShopfront"
                        }),
                        search.createColumn({name: "custrecord_rfs_physicalcount_account", label: "Account"}),
                        search.createColumn({name: "isinactive", label: "Inactive"}),
                        search.createColumn({
                            name: "custrecord_rfs_physicalcount_h_invstatus",
                            label: "invStatus"
                        }),
                        search.createColumn({
                            name: "custrecord_rfs_physicalcount_isdirected",
                            label: "isDirected"
                        }),
                        search.createColumn({name: "custrecord_rfs_physicalcount_isparent", label: "isParent"}),
                        search.createColumn({name: "custrecord_rfs_storecount_isstorecount", label: "isStoreCount"}),
                        //search.createColumn({name: "custrecord_rfs_physicalcount_itemlimit", label: "Item Limit"}),
                        search.createColumn({
                            name: "custrecord_rfs_physicalcount_usebins",
                            label: "Items That Use Bins"
                        }),
                        search.createColumn({name: "custrecord_rfs_physicalcount_location", label: "location"}),
                        search.createColumn({name: "owner", label: "owner"}),
                        search.createColumn({name: "custrecord_rfs_physicalcount_parent", label: "parent"}),
                        search.createColumn({name: "custrecord_rfs_stockcount_recountlink", label: "recountId"}),
                        search.createColumn({name: "custrecord_rfs_physicalcount_subsidiary", label: "subsidiary"}),
                        search.createColumn({name: "created", label: "createdAt"}),
                        search.createColumn({name: "lastmodified", label: "modDate"}), // Last Modified
                        search.createColumn({name: "lastmodifiedby", label: "modEmpId"}), // Employee making the last mod
                    ]
            });
            const searchStockCountHeadersCount = stockCountHeadersSearchObj.runPaged().count;
            log.debug("searchStockCountHeaders result count", searchStockCountHeadersCount);
            const headers = {};
            const bohCountList = [{title: '', value: null}];
            const fohCountList = [{title: '', value: null}];
            const arrColumnLabels = ['bCountingGroup','iCountingGroup']
            const intColumnLabels = ['status']
            // Wooloongabba has a parent with a higher ID than its children
            // Store the hierarchy here temporarily

            stockCountHeadersSearchObj.run().each(function (result) {
                // .run().each has a limit of 4,000 results
                const header = {
                    children: [],
                    recounts: []
                };
                util.each(result.columns, function (column, itemId) {
                    const value = result.getValue(result.columns[itemId])
                    if (![''].includes(value)) {
                        if (intColumnLabels.includes(column.label)) {
                            header[column.label] = Number.parseInt(value)
                        } else if (arrColumnLabels.includes(column.label)) {
                            header[column.label] = value.split(',')
                        } else {
                            header[column.label] = value
                        }
                    }
                })
                headers[result.id] = header
                return true
            })
            Object.keys(headers).forEach((headerId) => {
                const header = headers[headerId]
                if (header['parent']) {
                    log.debug({title: 'Header with Parent', details: header})
                    // This count has a parent and, therefore, is a child of another.
                    // Add this count to the parent's list of children
                    headers[header['parent']]['children'].push(header.id)
                } else {
                    if (!header['recountId']) {
                        // This is a top level count (not a child or a recount), so add it to the correct list
                        const topLevelCount = {
                            title: `${header['id']}: ${header['name']} [${rfSmartStatus[header['status']]}]`,
                            value: header['id']
                        }
                        if (header['isRetailShopfront']) {
                            fohCountList.push(topLevelCount)
                        } else {
                            bohCountList.push(topLevelCount)
                        }
                    }
                }
                if (header['recountId']) {
                    // This count is a recount. Add this count to the first count's list of recounts
                    headers[header['recountId']]['recounts'].push(header.id)
                }
                return true;
            })
            return {
                headers,
                fohCountList,
                bohCountList
            }
        }

        function getStockCountDetails(countId) {
            const searchStockCountDetail = search.create({
                type: "customrecord_rfs_physicalcountdetail",
                filters:
                    [
                        ["custrecord_rfs_physicalcount_detail", "is", countId]
                    ],
                columns:
                    [
                        search.createColumn({name: "internalid", label: "id"}),
                        search.createColumn({name: "custrecord_rfs_physicalcount_detail", label: "cId"}), // Count ID
                        search.createColumn({name: "custrecord_rfs_physicalcount_item", label: "iId"}), // Item ID
                        search.createColumn({name: "custrecord_rfs_physicalcount_bin", label: "bId"}), // bin ID
                        search.createColumn({name: "custrecord_rfs_physicalcount_description", label: "desc"}),
                        search.createColumn({name: "custrecord_rfs_physicalcount_onhand_qty", label: "oh"}),
                        //search.createColumn({name: "custrecord_rfs_physicalcount_onhandchngd", label: "ohChanged"}),
                        search.createColumn({name: "custrecord_rfs_physicalcount_counted_qty", label: "count"}),
                        search.createColumn({name: "custrecord_rfs_physicalcount_adj_qty", label: "diff"}),
                        //search.createColumn({name: "custrecord_rfs_physicalcount_unitrate", label: "Unit Rate"}),
                        search.createColumn({name: "custrecord_rfs_physicalcount_price", label: "price"}),
                        search.createColumn({name: "custrecord_rfs_physicalcount_dtl_status", label: "approved"}),
                        search.createColumn({name: "custrecord_rfs_physicalcount_approvaldt", label: "approvedDate"}),
                        search.createColumn({name: "custrecord_rfs_physicalcount_adjtx", label: "iaId"}),
                        search.createColumn({name: "custrecord_rfs_physicalcount_uom", label: "uom"}), // Unit of Measure e.g. Each
                        search.createColumn({name: "custrecord_rfs_physicalcount_haserror", label: "hasError"}), // Unit of Measure e.g. Each
                        search.createColumn({name: "custrecord_rfs_physicalcount_onhand_calc", label: "onHandCalc"}), // Unit of Measure e.g. Each
                        search.createColumn({name: "lastmodified", label: "modDate"}), // Last Modified (Date)
                        search.createColumn({name: "lastmodifiedby", label: "modEmpId"}), // Last Modified By
                    ]
            });
            const searchResultCount = searchStockCountDetail.runPaged().count;
            log.debug("Stock Count Results row count", searchResultCount);
            const results = [];
            const lastModifiedBy = {};
            let resultFormatted = {};
            let overs = 0
            let unders = 0
            // .run().each has a limit of 4,000 results
            // .runPaged() offers unlimited results via pagination
            const integerColumnLabels = ['oh', 'count', 'diff'] //, 'Unit Rate']
            const floatColumnLabels = ['price']
            const pagedData = searchStockCountDetail.runPaged();
            pagedData.pageRanges.forEach(function (pageRange) {
                const page = pagedData.fetch({index: pageRange.index});
                page.data.forEach(function (result) {
                    resultFormatted = {};
                    util.each(result.columns, function (column, itemId) {
                        if (integerColumnLabels.includes(column.label)) {
                            resultFormatted[column.label] = Number.parseInt(result.getValue({name: result.columns[itemId].name}))
                        } else if (floatColumnLabels.includes(column.label)) {
                            resultFormatted[column.label] = Number.parseFloat(result.getValue({name: result.columns[itemId].name}))
                        } else {
                            resultFormatted[column.label] = result.getValue({name: result.columns[itemId].name})
                        }
                    })
                    let variance = 0
                    if (resultFormatted['diff']) {
                        if (resultFormatted['diff'] && resultFormatted['price']) {
                            variance = Math.round(100 * resultFormatted['diff'] * resultFormatted['price']) / 100
                        }
                        resultFormatted['net$'] = variance
                        if (variance > 0) {
                            resultFormatted['over$'] = variance
                        } else if (variance < 0) {
                            resultFormatted['under$'] = variance
                        }
                    }
                    results.push(resultFormatted);
                    /* This is an attempt to indicate counters (lastModifiedBy is the closest we can get BoH) */
                    /*
                    const lmb = resultFormatted['Last Modified By']
                    const lm = resultFormatted['Last Modified']
                    if (!Object.keys(lastModifiedBy).includes(lmb)) {
                        lastModifiedBy[lmb] = {
                            count: 1,
                            lastModified: lm
                        }
                    } else {
                        lastModifiedBy[lmb].count += 1
                        lastModifiedBy[lmb].lastModified = lm
                    }
                    */
                    return true;
                })

                return true;
            });
            return {
                details: results,
            }
        }

        function getStockCountSections(countIdArr) {
            const searchStockCountSections = search.create({
                type: "customrecord_rfs_countsection",
                filters:
                    [
                        ["custrecord_rfs_countsection_count", "anyof", countIdArr]
                    ],
                columns:
                    [
                        search.createColumn({name: "internalid", label: "id"}), // Internal Id for Section record
                        search.createColumn({name: "custrecord_rfs_countsection_count", label: "cId"}), // Count ID
                        search.createColumn({name: "custrecord_rfs_countsectionline", label: "dId"}), // Count Detail ID
                        search.createColumn({name: "custrecord_rfs_countsection_section", label: "section"}), // Section Name
                        search.createColumn({name: "custrecord_rfs_countsection_item", label: "iId"}), // The item ID
                        search.createColumn({name: "custrecord_rfs_countsection_counter_qty", label: "count"}),
                        search.createColumn({name: "custrecord_rfs_countsection_datetime", label: "at"}), // Counted At time
                        search.createColumn({name: "custrecord_rfs_countsection_employee", label: "eId"}), // TThe Employee ID (some people may o
                        search.createColumn({
                            name: "custitem_anx_item_category",
                            join: "CUSTRECORD_RFS_COUNTSECTION_ITEM",
                            label: "Item Category"
                        }),
                        search.createColumn({
                            name: "custitem_anx_item_sub_category",
                            join: "CUSTRECORD_RFS_COUNTSECTION_ITEM",
                            label: "Item Sub Category"
                        }),
                        search.createColumn({
                            name: "custitem_anx_item_sub_sub_category",
                            join: "CUSTRECORD_RFS_COUNTSECTION_ITEM",
                            label: "Item Sub Sub Category"
                        }),
                        search.createColumn({
                            name: "upccode",
                            join: "CUSTRECORD_RFS_COUNTSECTION_ITEM",
                            label: "UPC Code"
                        })
                    ]
            });
            //const searchResultCount = searchStockCountSections.runPaged().count;
            //log.debug("customrecord_rfs_countsectionSearchObj result count",searchResultCount);
            const pagedData = searchStockCountSections.runPaged();
            const results = []
            const integerColumnLabels = ['count'] //, 'Unit Rate']
            pagedData.pageRanges.forEach(function (pageRange) {
                const page = pagedData.fetch({index: pageRange.index});
                page.data.forEach(function (result) {
                    resultFormatted = {};
                    util.each(result.columns, function (column, itemId) {
                        if (integerColumnLabels.includes(column.label)) {
                            resultFormatted[column.label] = Number.parseInt(result.getValue({name: result.columns[itemId].name}))
                        } else {
                            resultFormatted[column.label] = result.getValue({name: result.columns[itemId].name})
                        }
                    })
                    results.push(resultFormatted);
                    /* This is an attempt to indicate counters (lastModifiedBy is the closest we can get BoH) */
                    /*
                    const lmb = resultFormatted['Last Modified By']
                    const lm = resultFormatted['Last Modified']
                    if (!Object.keys(lastModifiedBy).includes(lmb)) {
                        lastModifiedBy[lmb] = {
                            count: 1,
                            lastModified: lm
                        }
                    } else {
                        lastModifiedBy[lmb].count += 1
                        lastModifiedBy[lmb].lastModified = lm
                    }
                    */
                    return true;
                })

                return true;
            });
            return results
            }

        return {
            onRequest: onRequest
        };

    });
