var forEach = function(array, callback){
   var currentValue, index;
   for (i = 0; i < array.length; i += 1) {
      if(typeof array[i] == "undefined"){
         currentValue = null;
      } else {
         currentValue = array[i];
      }
      index = i;
      callback(currentValue, i, array);
    }
}

// Determine directory seperator
var getDirectorySeperator = function( s : Switch ){
    var directorySeperator;
    if(s.isMac()){
        directorySeperator = '/';
    } else {
        directorySeperator = '\\'
    }

    return directorySeperator;
};


var getElementProperties = function(s : Switch ){
	var p = {
		trigger: s.getPropertyValue("Trigger"),
		target: s.getPropertyValue("Target"),
		job_path: s.getPropertyValue("JobPath"),
		job_repository: s.getPropertyValue("JobRepository"),
		job_name: s.getPropertyValue("JobName"),
		extension: s.getPropertyValue("Extension"),
		inject_type: s.getPropertyValue("InjectType"),
		target_url: null,
		target_basename: null
	};

	// Determine the job path based on prop
	if(p.target == "Specific job"){
		p.target_url = p.job_path;
	} else if(p.target == "Job repository"){
		if(!p.extension){
			p.target_url = p.job_repository + getDirectorySeperator(s) + p.job_name;
		} else {
			p.target_url = p.job_repository + getDirectorySeperator(s) + p.job_name + '.' + p.extension;
		}
	}

	// Resolve the target basename
	var basename_regex = new RegExp("[\\/]");
	p.target_basename = p.target_url.split(basename_regex).pop();

	s.log(-1, p.target_url + " " + p.target_basename);

	// Ensure url is set
	if(!p.target_url){
		s.log(3, "Job resource location could not be resolved.");
	}

	return p;
}

var getTargetType = function( url ){
	// Check to see if it is a directory
	//exists = false;
	type = false;
	dir = new Dir( url );
	if(dir.exists === true){
		//exists = true;
		type = "dir";
	} else {
		// Check to see if is a file
		fs = new FileStatistics( url );
		is_file = fs.isFile();
		if(is_file == true){
			//exists = true;
			type = "file";
		}
	}

	return type;

}

var handleInject = function( prop, s : Switch, job : Job, callback ){

	if(prop.inject_type == "Assert exists"){
		type = getTargetType(prop.target_url);

		if(type === false){
			callback(false, "Target file does not exist!", job.getPath());
		} else {
			callback(true, "Target file does exist.", job.getPath());
		}

	} else if(prop.inject_type == "Inject (read-only)"){

		type = getTargetType(prop.target_url);

		if(type === false){
			callback(false, "Target file does not exist!", job.getPath());
		} else {
			s.log(2, "exists");

			if(type === "dir"){
				temp_path = s.createPathWithName(prop.target_basename, true);
			} else {
				temp_path = s.createPathWithName(prop.target_basename, false);
			}

			copy_successful = s.copy(prop.target_url, temp_path);
			if(copy_successful == true){
				callback(true, "Read-only inject was successful.", temp_path);
			} else {
				callback(false, "Read-only inject was unsuccessful.", job.getPath());
			}
		}

	}
}

function jobArrived( s : Switch, job : Job )
{

	var prop = getElementProperties(s);

	handleInject(prop, s, job, function(success, message, job_path){
		if(success === true){
			s.log(-1, message);
			job.sendToData(1, job_path );
		} else {
			s.log(3, message);
			job.sendToData(3, job.getPath() );
		}
	});

	return;

}
