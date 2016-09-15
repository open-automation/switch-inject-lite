// For each helper function
var forEach = function(array, callback){
   var currentValue, index;
   var i = 0;
   for (i; i < array.length; i += 1) {
      if(typeof array[i] == "undefined"){
         currentValue = null;
      } else {
         currentValue = array[i];
      }
      index = i;
      callback(currentValue, i, array);
    }
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
		target_basename: null,
		count_key: s.getPropertyValue("CountPrivateDataKey"),
		size_key: s.getPropertyValue("SizePrivateDataKey"),
		size_unit: s.getPropertyValue("SizeUnit"),
		name_after: s.getPropertyValue("InjectNameAfter"),
		search_depth: null
	};

	// Get search depth
	if(p.inject_type == "Count files"){
		p.search_depth = s.getPropertyValue("SearchDepthCount");
	} else if(p.inject_type == "Get size"){
		p.search_depth = s.getPropertyValue("SearchDepthSize");
	}

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

	// Save target type as a property
	if(p.target_url){
		p.target_type = getTargetType(p.target_url);
	}

	// Add trailing space to directory if necessary
	if(p.target_type == "dir"){
		last_character = p.target_url.substring(p.target_url.length-1, p.target_url.length);
		if(last_character !== "\\" && last_character !== "/"){
			p.target_url += getDirectorySeperator(s);
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

			// Determine output file name
			if(prop.name_after == "Incoming job"){
				output_basename = job.getName();
			} else {
				output_basename = prop.target_basename;
			}

			// Create temp path to copy to
			if(type === "dir"){
				temp_path = s.createPathWithName(output_basename, true);
			} else {
				temp_path = s.createPathWithName(output_basename, false);
			}

			// Copy and callback
			copy_successful = s.copy(prop.target_url, temp_path);
			if(copy_successful == true){
				callback(true, "Read-only inject was successful.", temp_path);
			} else {
				callback(false, "Read-only inject was unsuccessful.", job.getPath());
			}
		}

	} else if(prop.inject_type == "Count files"){
		type = prop.target_type;

		if(type === false){
			callback(false, "Target file does not exist!", job.getPath());
		} else if(type === "file"){
			job.setPrivateData(prop.count_key, 1);
			callback(true, "Target job is a single file.", job.getPath());
		} else if(type === "dir"){

			// Function for recursively counting files within a directory
			get_recursive_file_count = function(target_dir, entry_list, search_depth, file_count, iteration){
				if(typeof(file_count) == "undefined"){
					file_count = 0;
				}
				if(typeof(iteration) == "undefined"){
					iteration = 0;
				}
				if(iteration == search_depth){
					return file_count;
				}
				iteration++;

				forEach(entry_list, function(file_name, index){
					type = getTargetType(target_dir + file_name);
					if(type === "dir"){
						sub_target_dir = target_dir + file_name + getDirectorySeperator(s);
						sub_dir = new Dir(sub_target_dir);
						sub_file_list = sub_dir.entryList("*", Dir.Files|Dir.Dirs|Dir.NoDotAndDotDot, Dir.Name);
						result_count = get_recursive_file_count(sub_target_dir, sub_file_list, search_depth, file_count, iteration);
						file_count += result_count;
					} else if(type === "file"){
						file_count++;
					}
				});
				return file_count;
			}

			dir = new Dir( prop.target_url );
			file_list = dir.entryList("*", Dir.Files|Dir.Dirs|Dir.NoDotAndDotDot, Dir.Name);
			count = get_recursive_file_count(prop.target_url, file_list, prop.search_depth);

			job.setPrivateData(prop.count_key, count);
			callback(true, "Target job contains " + count + " files.", job.getPath());
		}

	} else if(prop.inject_type == "Get size"){
		type = getTargetType(prop.target_url);

		if(type === false){
			callback(false, "Target file does not exist!", job.getPath());
		} else if(type === "file"){

			fs = new FileStatistics(prop.target_url);
			byte_count = fs.getByteCount();

			job.setPrivateData(prop.size_key, byte_count);
			callback(true, "Target file is " + byte_count + " bytes.", job.getPath());

		} else if(type === "dir"){

			// Function for recursively counting bytes within a directory
			get_recursive_byte_count = function(target_dir, entry_list, search_depth, byte_count, iteration){
				if(typeof(byte_count) == "undefined"){
					byte_count = 0;
				}
				if(typeof(iteration) == "undefined"){
					iteration = 0;
				}
				if(iteration == search_depth){
					return byte_count;
				}
				iteration++;

				forEach(entry_list, function(file_name, index){
					type = getTargetType(target_dir + file_name);
					if(type === "dir"){
						sub_target_dir = target_dir + file_name + getDirectorySeperator(s);
						sub_dir = new Dir(sub_target_dir);
						sub_file_list = sub_dir.entryList("*", Dir.Files|Dir.Dirs|Dir.NoDotAndDotDot, Dir.Name);
						result_size = get_recursive_byte_count(sub_target_dir, sub_file_list, search_depth, byte_count, iteration);
						byte_count += result_size;
					} else if(type === "file"){
						fs = new FileStatistics(target_dir + file_name);
						byte_count += fs.getByteCount();
					}
				});
				return byte_count;
			}

			// Function to convert bytes to other sizes
			bytesToSize = function(bytes, unit) {
				if(bytes === 0 || unit == "Bytes") return bytes;
				units = {};
				units.KB = 1024;
				units.MB = units.KB * 1024;
				units.GB = units.MB * 1024;
				units.TB = units.GB * 1024;
				return Math.floor(bytes / units[unit]);
			};

			dir = new Dir( prop.target_url );
			file_list = dir.entryList("*", Dir.Files|Dir.Dirs|Dir.NoDotAndDotDot, Dir.Name);
			byte_count = get_recursive_byte_count(prop.target_url, file_list, prop.search_depth);

			converted_size = bytesToSize(byte_count, prop.size_unit);

			job.setPrivateData(prop.size_key, converted_size);
			callback(true, "Target directory is " + converted_size + " " + prop.size_unit + ".", job.getPath());
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
