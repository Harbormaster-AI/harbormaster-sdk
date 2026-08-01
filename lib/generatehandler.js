const user			    = require('./user');
const requestHandler	= require('./requesthandler');
const fileHandler		= require('./filehandler');
const modelHandler		= require('./modelhandler');
const techStackHandler	= require('./blueprinthandler');
var constants 			= require("./constants");
var util 				= require('util');
const Configstore 		= require('configstore');
const conf 				= new Configstore(constants.HARBORMASTER);
const Status 			= require("./status");
const status			= new Status();

module.exports = {

	generateSystem: (yamlFile, inputOptions ) => {

		return new Promise(async function(resolve, reject) {

			let systemAsCode = null;

			    fileHandler.loadYMLToJSON(yamlFile, function( err, data ){

				if ( err ) {
					//reject( err );
					//return;
				}
				systemAsCode = data;

			});

            if ( systemAsCode == null ) {
                reject( "Failed to load system-a-code yaml file.");
                return;
            }

			if ( systemAsCode != null ) {

                var deleteOption = 'ALWAYS';
                var system              = systemAsCode.system;

                if ( user.authenticated() )
                    deleteOption = 'NEVER';

                // inputs take precedence over YAML file content
                if ( inputOptions.application_name )
                    system.options.application.name = inputOptions.application_name;

                if ( inputOptions.application_description )
                    system.options.application.description = inputOptions.application_description;

                if ( inputOptions.blueprint_name )
                    system.blueprint.name = inputOptions.blueprint_name;

                if ( inputOptions.model_name )
                    system.model.name = inputOptions.model_name;

                if ( inputOptions.git_repository )
                    system.git.repository = inputOptions.git_repository;

                if ( inputOptions.git_token )
                    system.git.password = inputOptions.git_token;

                if ( inputOptions.docker_repository )
                    system.docker.repository = inputOptions.docker_repository;

                if ( inputOptions.docker_password )
                    system.git.password = inputOptions.docker_password;


                var endpoint    = "generateSystem";
                var body = { // the back end still uses project while outside the backend, system is used
                            userId:                     116, //user.getUserId(),
                            deleteOptions:              deleteOption,
                            name:                       system.name == null ? reject( "system->name cannot be empty") : system.name,
                            description:                system.description == null ? reject( "system->description cannot be empty") : system.description,
                            blueprintName:              system.blueprint.name == null ? reject( "system->blueprint->name cannot be empty") : system.blueprint.name,
                            modelName:                  system.model.name == null ? reject( "system->model->name cannot be empty") : system.model.name,
                            aws:                        system.aws,
                            kubernetes:                 system.kubernetes,
                            docker:                     system.docker,
                            git:                        system.git,
                            terraform:                  system.terraform,
                            options:                    system.options
                            }
                // ------------------------------------------
                // check for application values
                // ------------------------------------------
                if ( system.options.application.name == null ) {
                    reject( "Application name cannot be empty" );
                    return;
                }

                // ------------------------------------------
                // check for github values
                // ------------------------------------------
                if ( system.git.owner == null ) {
                    reject( "Git owner cannot be empty" );
                    return;
                }

                if ( system.git.password == null ) {
                    reject( "Git password cannot be empty." );
                    return;
                }

                if ( system.git.host == null ) {
                    reject( "Git host cannot be empty" );
                    return;
                }

                if ( system.git.repository == null ) {
                    reject( "Git repository cannot be empty" );
                    return;
                }

                var endpoint = "generateSystem"
                return requestHandler.handleRequest( endpoint, body, function(err, data) {

                    if ( err ) {
                        reject( status.error(err,
                                util.format(constants.COMMAND_ERROR, constants.MODEL_LIST_REQUEST_MSG) ));
                    }
                    else {
                        if ( data?.success == undefined ) {
                            const p = module.exports.provenance( system, data );
                            resolve( p );
                        }
                        else
                            resolve( data );
                    }
                }, true);
			}

		});

    },

    provenance: (system, build) => {
        var results = {};

        if ( build ) {
            results = {
                generator: "Harbormaster CLI",
                cliVersion: "1.2.0",
                datetime: build.endDateTime,
                commitSHA: build.commitSHA ?? "",
                blueprint: system.blueprint.name ?? "",
                domainModel: system.model.name ?? "",
                cloud: "AWS",
                terraform: system.terraform.inUse ?? "",
                kubernetes: system.kubernetes.inUse ?? "",
                generationId: build.buildIdentifier ?? "",
                certificationId: build.certification.certificationIdentifierAsString ?? "",
                repository: system.git.owner + '/' + system.git.repository,
                totalFiles: build.generateAppStats.totalFilesProcessed.toLocaleString(),
                totalLOCs: build.generateAppStats.totalLines.toLocaleString(),
            }
        }
        return results;
    }
}