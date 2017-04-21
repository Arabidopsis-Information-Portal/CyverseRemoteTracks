define([
           'dojo/_base/declare',
           'dojo/_base/array',
           'dojo/request/xhr',
           'JBrowse/ConfigManager',
           'JBrowse/Plugin'
       ],
       function(
           declare,
           array,
           xhr,
           ConfigManager,
           JBrowsePlugin
       ) {
return declare( JBrowsePlugin,
{
    constructor: function( args ) {
        var browser = args.browser;
        var thisB = this;

        // do anything you need to initialize your plugin here
        console.log( "CyverseRemoteTracks plugin starting" );

        return thisB.browser._milestoneFunction('createTrack', function( deferred ) {
            var filesApiUrl = args.filesApiBaseUrl + "/listings/system/"
                + args.storageSystemId + '/' + args.configFilesPath;

            xhr(filesApiUrl, {
                handleAs: "json",
                query: {
                    "pretty": "true",
                    "filter": "path,type"
                },
                headers: {
                    "Authorization": "Bearer " + args.accessToken
                }
            }).then(function(data) {
                var allFiles = data.result;
                var confFiles = array.filter(allFiles, function( elem ){
                    return (elem.type == "file" && elem.path.endsWith(".conf"));
                });
                var dataRoot = args.anonFilesBaseUrl;
                var includes = confFiles.map( function( elem ) {
                    return dataRoot + elem.path;
                });
                var c = new ConfigManager({
                    bootConfig: {},
                    defaults: { include: includes },
                    browser: thisB
                });
                c.getFinalConfig().then(
                    dojo.hitch( thisB, function( finishedConfig2 ) {
                        thisB.config2 = finishedConfig2;
                        thisB.browser.config.stores = dojo.mixin(thisB.browser.config.stores, thisB.config2.stores);
                        thisB.browser.config.tracks = dojo.mixin(thisB.browser.config.tracks, thisB.config2.tracks);
                        thisB.config2.tracks.map( function( trackConfig ) {
                            thisB.browser.publish( '/jbrowse/v1/v/tracks/new', [trackConfig] );
                        });
                    })
                );
            }, function(err) {
                console.log("Error querying Cyverse Data Store for JBrowse .conf files");
            });
        });
    }

});
});
