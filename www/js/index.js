//var siteRoot = 'http://ulprojectfinder.byethost4.com/';
var siteRoot = 'http://localhost/testcodes/';
var restUrl = siteRoot+'REST/';
var currentPage = $("ul#projectlist").attr('data-end'); //Hold the currentPage
var category = ""; //Category name
var totalNo = 20; //Specifies the number of projects per page
var offset = 0; //Specifies the offset level
var searchParam = $("input#customSearch").val() ? $("input#customSearch").val() : "";

var $ = jQuery;
$(document).ready(function(){
    $('#signout, .signout').click(function(){sessionStorage.clear(); window.location='';}); //Signout Handler
    if(sessionStorage.loggedUser == null || sessionStorage.loggedUser == "" || sessionStorage.loggedUser == "undefined"){
        $('.guest-enabled').show(); $('.user-enabled').hide(); loadDepartments(); fetchProjects(totalNo, offset, searchParam);
    }else{
        $('.guest-enabled,a.registerPageLink, a#registerPage').hide(); $('.user-enabled').show();
        $('.login-link').attr('data-popup', '.popup-change-pass').find('i').removeClass('icon-user').addClass('icon-key');
        switch(sessionStorage.loggedUser){
            case 'student': $('.student-enabled').show(); $('a#profile-link').attr('data-popup','.popup-student-profile'); 
                            loadDepartments(); fetchMyDeptSupervisors(); loadStudProfileDetails(); loadMyProjects();fetchProjects(totalNo, offset, searchParam);
                            $('form#changepassword').attr('action', 'student-change-password.php');
                            $('form#changepassword input#LoggedInStudentId').val(sessionStorage.studentId);
                            break;
            case 'supervisor':  $('.supervisor-enabled').show(); $('a#profile-link').attr('data-popup','.popup-supervisor-profile'); 
                                loadSuperProfileDetails(); loadMyStudentsProjects();fetchProjects(totalNo, offset, searchParam);
                                $('form#changepassword').attr('action', 'supervisor-change-password.php');
                                $('form#changepassword input#LoggedInSupervisorId').val(sessionStorage.supervisorEmail);
                                break;
            default:            loadDepartments(); fetchProjects(totalNo, offset, searchParam);
                                break;
        }
    }

    $('a.registerPageLink, a#registerPage').click(function(){ loadDepartments(); fetchProjects(totalNo, offset, searchParam); });
    $(document).on('submit', "form#ContactForm", function(e){ 
        e.stopPropagation();
        e.preventDefault();
        var formData = new FormData($(this)[0]);
        formData.append('register', 'true');
        $.ajax({
            url: restUrl+$(this).attr("action"),
            type: 'GET',
            data: formData,
            dataType:'jsonp',
            cache: false,
            contentType: false,
            async: false,
            success : function(data, status) {
                if(data.status == "1"){
                    $("#messageBox, .messageBox").html('<div class="alert alert-success"><button type="button" class="close" data-dismiss="alert">&times;</button>'+data.msg+'. Please login through the login form.</div>').addClass('success');
                }
                else if(data.status != null && data.status != 1) {
                    $("#messageBox, .messageBox").html('<div class="alert alert-warning"><button type="button" class="close" data-dismiss="alert">&times;</button>'+data.msg+'</div>').addClass('success');
                }
                else {
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>'+data+'</div>').addClass('success');
                }
            },
            processData: false
        });
        return false;
    });
    $(document).on('submit', "form#changepassword", function(e){ 
        e.stopPropagation();
        e.preventDefault();
        var formData = $(this).serialize();
        //var formData = new FormData($(this)[0]);
        //formData.append((sessionStorage.loggedUser=='student' ? 'LoggedInStudentId': 'LoggedInSupervisorId'), (sessionStorage.loggedUser=='student' ? sessionStorage.studentId : sessionStorage.supervisorEmail));
        $.ajax({
            url: restUrl+$(this).attr("action"),
            type: 'GET',
            dataType:'jsonp',
            cache: false,
            //contentType: false,
            data: formData,
            crossDomain: true,
            async: false,
            success : function(data, status) {
                if(data.status == "1"){
                    $("#messageBox, .messageBox").html('<div class="alert alert-success"><button type="button" class="close" data-dismiss="alert">&times;</button>'+data.msg+' Signing out...</div>');
                    setInterval(function(){ sessionStorage.clear(); window.location=''; }, 3000);
                }
                else if(data.status != null && data.status != 1) {
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>'+data.msg+'</div>');
                }
                else {
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>'+data+'</div>');
                }
            },
            error : function(xhr, status) {
                erroMsg = '';
                console.log(xhr);
                if(xhr.status===0){ erroMsg = 'There is a problem connecting to internet. Please review your internet connection.'; }
                else if(xhr.status===404){ erroMsg = 'Requested page not found.'; }
                else if(xhr.status===500){ erroMsg = 'Internal Server Error.';}
                else if(status==='parsererror'){ erroMsg = 'Error. Parsing JSON Request failed.'; }
                else if(status==='timeout'){  erroMsg = 'Request Time out.';}
                else { erroMsg = 'Unknow Error.\n'+xhr.responseText;}          
                $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>'+erroMsg+'</div>');
                $('ul#myprojectslist').append('<input type="button" class="close-popup form_submit" style="background:#3c3c3c" value="Close" />');
            },
            processData: false
        });
        return false;
    });
    $(document).on('click', ".briefcase-icon a, a#allProjectsLink, a.allProjectsLink", function(){ fetchProjects(totalNo, offset, searchParam); });
    $(document).on('click', "a.downloadLink", function(){ window.location=$(this).attr('href'); });
     $(document).on('keyup', "input#customSearch", function(){ fetchProjects(totalNo, offset, $("input#customSearch").val()); });

    $("form#LoginForm").submit(function(e){ 
        e.stopPropagation();
        e.preventDefault();
        var formDatas = $(this).serialize();
        var userType = $('#userType').val();
        if(userType === 'Supervisor'){ supervisorLogin(restUrl+'supervisor-login.php', formDatas); }
        else if(userType === 'Admin'){ adminLogin(restUrl+'admin-login.php', formDatas); }
        else if(userType === 'Student'){ studentLogin(restUrl+'student-login.php', formDatas); }
        return false;
    });
    $(document).on('submit', "form#resetpassword", function(e){ 
        e.stopPropagation();
        e.preventDefault();
        var formData = $(this).serialize();
        $.ajax({
            url: restUrl+$(this).attr("action"),
            type: 'GET',
            data: formData,
            cache: false,
            dataType:'jsonp',
            contentType: false,
            async: false,
            success : function(data, status) {
                if(data.status == "1"){
                    $("#messageBox, .messageBox").html('<div class="alert alert-success"><button type="button" class="close" data-dismiss="alert">&times;</button>'+data.msg+'</div>');
                }
                else if(data.status != null && data.status != 1) {
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>'+data.msg+'</div>');
                }
                else {
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>'+data+'</div>');
                }
            },
            processData: false
        });
        return false;
    });
    
    $(document).on('submit', "form#form-upload-project", function(e){ 
        e.stopPropagation();
        e.preventDefault();
        var formData = new FormData($(this)[0]);
        formData.append('author', sessionStorage.studentId);
        formData.append('department', sessionStorage.studentDepartment);
        
        $.ajax({
            url: restUrl + $(this).attr("action"),
            type: 'POST',
            data: formData,
            cache: false,
            dataType:'json',
            contentType: false,
            async: false,
            success : function(data, status) {
                if(data.status == "1"){
                    $("#messageBox, .messageBox").html('<div class="alert alert-success"><button type="button" class="close" data-dismiss="alert">&times;</button>'+data.msg+'</div>');
                }
                else if(data.status != null && data.status != 1){
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>'+data.msg+'</div>');
                }
                else {
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>'+data+'</div>');
                }
                loadMyProjects();
            },
            processData: false
        });
        return false;
    });
    $(document).on('submit', "form#updateform, form#updatesuperform",function(e){ 
        e.stopPropagation();
        e.preventDefault();
        var formData = new FormData($(this)[0]);
        formData.append('update', 'true');
        $.ajax({
            url: restUrl+$(this).attr("action"),
            type: 'GET',
            data: formData,
            cache: false,
            dataType:'jsonp',
            contentType: false,
            async: false,
            success : function(data, status) {
                if(data.status == "1"){
                    $("#messageBox, .messageBox").html('<div class="alert alert-success"><button type="button" class="close" data-dismiss="alert">&times;</button>'+data.msg+' Signing out...</div>');
                    setInterval(function(){ sessionStorage.clear(); window.location=''; }, 3000);
                }
                else if(data.status != null && data.status != 1) {
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>'+data.msg+'</div>');
                }
                else {
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>'+data+'</div>');
                }
            },
            processData: false
        });
        return false;
    });
    var currentStatus;
    $(document).on('click', '.approve-project', function() {
        currentStatus = 'Approve'; if(parseInt($(this).attr('data-status')) == 1) currentStatus = "Disapprove";
        if(confirm("Are you sure you want to "+currentStatus+" this project? Project title: '"+$(this).attr('data-title')+"'")) approvalThisProject($(this).attr('data-id'), $(this).attr('data-status'));
    });
    $(document).on('click', '.delete-project', function() {
        if(confirm("Are you sure you want to delete this project? Project title: '"+$(this).attr('data-title')+"'. Note that project file will also be delete.")) deleteThisProject($(this).attr('data-id'), $(this).attr('data-project-file'));
    });
    $(document).on("swipeleft", "ul#projectlist", function(){ swipeLeftHandler(); });
    $(document).on("swiperight", "ul#projectlist", function(){ swipeRightHandler(); });
    $(document).on("click", "span#next-projects", function(){ swipeLeftHandler(); });
    $(document).on("click", "span#prev-projects", function(){ swipeRightHandler(); });
    $(document).on({
        ajaxStart: function() { $('.messageBox').html('<div style="text-align:center;"><img src="images/ajax-loader.gif" id="ajaxLoader" /></div>'); },
        ajaxStop: function() { $('img#ajaxLoader').hide();}    
    });
    
    
    function swipeLeftHandler(){
        currentPage = parseInt($("ul#projectlist").attr('data-end'))+1; //fetch the last page number nd increment it
        $("ul#projectlist").attr('data-end', currentPage); //Update the pagenumber holder [data-end]
        fetchProjects(totalNo, (currentPage - 1) * totalNo, $("input#customSearch").val());
    }
    function swipeRightHandler(){
        currentPage = parseInt($('ul#projectlist').attr('data-end')); //fetch the last page number
        if(currentPage>1){//Check if at least it is not d home page
            currentPage -=1; //Decrement the page number to go prevous page 
            $('ul#projectlist').attr('data-end', currentPage); //Update the pagenumber holder [data-end]
            fetchProjects(totalNo, (currentPage - 1) * totalNo, $("input#customSearch").val());
        }
    }
    
    function loadMyProjects(){
        $('ul#myprojectslist').empty();
        $.ajax({
            url: restUrl + "fetch-projects.php",
            type: 'GET',
            dataType:'jsonp',
            contentType: false,
            crossDomain: true,
            data: {fetchForMobileStudent:'true', author:sessionStorage.studentId },
            cache: false,
            success : function(data, status) {
                $('ul#myprojectslist').empty().append('<li style="margin-top:-15px"></li>');
                if(data.status!=null & data.status!==1){ 
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>'+data.msg+'</div>');
                }
                else if(data.status!=null & data.status===1){
                    $.each(data.info, function(i, item) {
                        if(item.fileType == "docx" || item.fileType == "doc" || item.fileType == "txt"){ src = "images/icons/word.jpg"; }
                        else if(item.fileType == "pdf"){ src = "images/icons/pdf.jpg"; }
                        else{ src = "images/icons/blank.jpg"; }
                        projectFile = siteRoot+'project/'+item.projectFile;
                        $('ul#myprojectslist').append('<li><div class="feat_small_icon"><img src="'+src+'" alt="" title="" /></div><div class="feat_small_details"><h4>'+item.title+'</h4><div style="padding:5px 0px 5px 0px"><strong style="font-weight:bold;">Category:</strong> '+item.category+' <br/><strong style="font-weight:bold;">Supervisor:</strong> '+item.supervisor+' <br/><strong style="font-weight:bold;">Date Added:</strong> '+item.dateUploaded+' <br/><strong style="font-weight:bold;">Year:</strong> '+item.year+' <br/><strong style="font-weight:bold;">Status:</strong> '+((item.status==1) ? '<b class="success"><i class="icon icon-check"></i> Approved</b>' : '<b class="warning"><i class="icon icon-check-empty"></i> Pending</b>')+' </div><div class="hidden">These</div><a href="'+projectFile+'" class="button_small downloadLink">Download</a></div> </li> ');
                    });
                }
                else{ $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>'+data+'</div>'); }
                $('ul#myprojectslist').append('<input type="button" class="close-popup form_submit" style="background:#3c3c3c" value="Close" />');
            },
            error : function(xhr, status) {
                erroMsg = '';
                if(xhr.status===0){ erroMsg = 'There is a problem connecting to internet. Please review your internet connection.'; }
                else if(xhr.status===404){ erroMsg = 'Requested page not found.'; }
                else if(xhr.status===500){ erroMsg = 'Internal Server Error.';}
                else if(status==='parsererror'){ erroMsg = 'Error. Parsing JSON Request failed.'; }
                else if(status==='timeout'){  erroMsg = 'Request Time out.';}
                else { erroMsg = 'Unknow Error.\n'+xhr.responseText;}          
                $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>'+erroMsg+'</div>');
                $('ul#myprojectslist').append('<input type="button" class="close-popup form_submit" style="background:#3c3c3c" value="Close" />');
            }
        });
    }
    function supervisorLogin($loginRestUrl, formDatas){
        $.ajax({
            url: $loginRestUrl,
            type: 'GET',
            dataType:'jsonp',
            contentType: false,
            crossDomain: true,
            data: formDatas,
            cache: false,
            success : function(data, status) {
                if(data.status == "1"){
                    $.each(data.info, function(i, item) {
                        if (typeof localStorage !== "undefined") {
                            sessionStorage.loggedUser = 'supervisor';
                            sessionStorage.supervisor = item.name;
                            sessionStorage.supervisorEmail = item.id;
                            sessionStorage.supervisorDept = item.department;
                        }
                    });
                    $("#messageBox, .messageBox").html('<div class="alert alert-success"><button type="button" class="close" data-dismiss="alert">&times;</button>Login Successful! Welcome '+sessionStorage.supervisor+', <img src="images/cycling.GIF" width="30" height="30" alt="Ajax Loading"> redirecting... please wait ...</div>');
                    setInterval(function(){ window.location = ''; }, 2000);
                }
                else {
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>'+data.msg+'</div>');
                }
            },
            error : function(xhr, status) {
                erroMsg = '';
                if(xhr.status===0){ erroMsg = 'There is a problem connecting to internet. Please review your internet connection.'; }
                else if(xhr.status===404){ erroMsg = 'Requested page not found.'; }
                else if(xhr.status===500){ erroMsg = 'Internal Server Error.';}
                else if(status==='parsererror'){ erroMsg = 'Error. Parsing JSON Request failed.'; }
                else if(status==='timeout'){  erroMsg = 'Request Time out.';}
                else { erroMsg = 'Unknow Error.\n'+xhr.responseText;}          
                $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>'+erroMsg+'</div>');
            }
        });
    }
    function studentLogin($loginRestUrl,formDatas ){
        $.ajax({
            url: $loginRestUrl,
            type: 'GET',
            dataType:'jsonp',
            contentType: false,
            crossDomain: true,
            data: formDatas,
            cache: false,
            success : function(data, status) {
                if(data.status == "1"){
                    $.each(data.info, function(i, item) {
                        if (typeof localStorage !== "undefined") {
                            sessionStorage.loggedUser = 'student';
                            sessionStorage.student = item.name;
                            sessionStorage.studentId = item.id;
                            sessionStorage.studentMatric = item.matricNo;
                            sessionStorage.studentEmail = item.email;
                            sessionStorage.studentPhone = item.phone;
                            sessionStorage.studentDepartment = item.department;
                        }
                    });
                    $("#messageBox, .messageBox").html('<div class="alert alert-success"><button type="button" class="close" data-dismiss="alert">&times;</button>Welcome '+sessionStorage.student+', <img src="images/cycling.GIF" width="30" height="30" alt="Ajax Loading"> redirecting... </div>');
                    setInterval(function(){ window.location = ''; }, 2000);
                }
                else if(data.status != null && data.status != 1){
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>'+data.msg+'</div>');
                }
                else {
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>'+data+'</div>');
                }
            },
            error : function(xhr, status) {
                erroMsg = '';
                if(xhr.status===0){ erroMsg = 'There is a problem connecting to internet. Please review your internet connection.'; }
                else if(xhr.status===404){ erroMsg = 'Requested page not found.'; }
                else if(xhr.status===500){ erroMsg = 'Internal Server Error.';}
                else if(status==='parsererror'){ erroMsg = 'Error. Parsing JSON Request failed.'; }
                else if(status==='timeout'){  erroMsg = 'Request Time out.';}
                else { erroMsg = 'Unknow Error.\n'+xhr.responseText;}          
                $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>'+erroMsg+'</div>');
            }
        });
    }
    function loadDepartments(){
        $('#department').empty();
        $.ajax({
            url: restUrl+"fetch-departments.php",
            type: 'GET',
            dataType:'jsonp',
            contentType: false,
            crossDomain: true,
            data: {},
            cache: false,
            success : function(data, status) {
                if(data.status === 0 ){ 
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>Department loading error. '+data.msg+'</div>');
                }
                if(data.status === 2 ){ 
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>No department available for this department</div>');
                     $('#department').append('<option value="">-- No department available --</option>');
                }
                if(data.status ===1 && data.info.length === 0){
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>No department available .</div>');
                }
                else if(data.status ===1 && data.info.length > 0){
                    $.each(data.info, function(i, item) {
                        $('#department').append('<option value="'+item.id+'">'+item.name+'</option>');
                    });
                } 

            }
        });
    }
    function fetchProjects(totalNo, offset, searchParam){
        $('#projectlist').empty();
        $.ajax({
            url: restUrl+"fetch-projects.php",
            type: 'GET',
            dataType:'jsonp',
            contentType: false,
            crossDomain: true,
            data: {fetchForMobileGuest:true, offset:offset, totalNo:totalNo, searchParam:searchParam},
            cache: false,
            success : function(data, status) {
                $('#projectlist').empty();
                if(data.status!=null & data.status!=1){ 
                    $('span#next-projects').hide();
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>'+(data.msg ? data.msg : data)+'</div>');
                }
                else if(data.status!=null & data.status===1){
                    $("#messageBox, .messageBox").html('');
                    $('span#next-projects').show();
                    $.each(data.info, function(i, item) {
                        if(item.fileType == "docx" || item.fileType == "doc" || item.fileType == "txt"){ src = "images/icons/word.jpg"; }
                        else if(item.fileType == "pdf"){ src = "images/icons/pdf.jpg"; }
                        else{ src = "images/icons/blank.jpg"; }
                        projectFile = siteRoot+'project/'+item.projectFile;
                        $('#projectlist').append('<li><div class="feat_small_icon"><img src="'+src+'" alt="" title="" /></div><div class="feat_small_details"><h4>'+item.title+'</h4><div>'+item.abstract.substr(0, 60)+' ..</div><div style="padding:5px 0px 5px 0px"><strong style="font-weight:bold;">Category:</strong> '+item.category+' <br/><strong style="font-weight:bold;">Year:</strong> '+item.year+' </div><div class="hidden">These</div><a href="'+projectFile+'" class="button_small downloadLink">Download</a></div> </li> ');
                    });
                }
                else{ 
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>'+(data.msg ? data.msg : data)+'</div>');
                }
            },
            error : function(xhr, status) {
                erroMsg = '';
                console.log(xhr);
                if(xhr.status===0){ erroMsg = 'There is a problem connecting to internet. Please review your internet connection.'; }
                else if(xhr.status===404){ erroMsg = 'Requested page not found.'; }
                else if(xhr.status===500){ erroMsg = 'Internal Server Error.';}
                else if(status==='parsererror'){ erroMsg = 'Error. Parsing JSON Request failed.'; }
                else if(status==='timeout'){  erroMsg = 'Request Time out.';}
                else { erroMsg = 'Unknow Error.\n'+xhr.responseText;}          
                $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>'+erroMsg+'</div>');
            }
        });
    }  
    function loadStudProfileDetails(){
        $('form#updateform #department').empty();
        $.ajax({
            url: restUrl+"fetch-departments.php",
            type: 'GET',
            dataType:'jsonp',
            contentType: false,
            crossDomain: true,
            data: {},
            cache: false,
            success : function(data, status) {
                $('form#updateform #department').empty();
                if(data.status === 0 ){ 
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>Department loading error. '+data.msg+'</div>');
                }
                if(data.status === 2 ){ 
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>No department available for this department</div>');
                     $('form#updateform #department').append('<option value="">-- No department available --</option>');
                }
                if(data.status ===1 && data.info.length === 0){
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>No department available .</div>');
                }
                else if(data.status ===1 && data.info.length > 0){
                    $('form#updateform #department').empty();
                    $('form#updateform #department').append('<option value="">-- Select your department --</option>');
                    $.each(data.info, function(i, item) {
                        $('form#updateform #department').append('<option value="'+item.id+'">'+item.name+'</option>');
                    });

                    var profileDetails = {name:sessionStorage.student, matricNo:sessionStorage.studentMatric, department:sessionStorage.studentDepartment, email:sessionStorage.studentEmail, phone:sessionStorage.studentPhone, id:sessionStorage.studentId};
                    $.each(profileDetails, function(key, value) { 
                        $('form#updateform #'+key).val(value);  
                    });
                } 

            }
        });
    }
    function fetchMyDeptSupervisors(){
        $('form#form-upload-project #supervisor').empty();
        $.ajax({
            url: restUrl + "fetch-supervisors-by-dept.php",
            type: 'GET',
            dataType:'jsonp',
            contentType: false,
            crossDomain: true,
            data: {getThisDeptSup:'true', department: sessionStorage.studentDepartment },
            cache: false,
            success : function(data, status) {
                $('form#form-upload-project #supervisor').empty();
                if(data.status === 0 ){ 
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>Supervisor loading error. '+data.msg+'</div>');
                }
                if(data.status === 2 ){ 
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>No supervisor available for this department</div>');
                     $('form#form-upload-project #supervisor').append('<option value="">-- No supervisor available for the chosen department --</option>');
                }
                if(data.status ===1 && data.info.length === 0){
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>No supervisor available for this department.</div>');
                }
                else if(data.status ===1 && data.info.length > 0){
                    $('form#form-upload-project #supervisor').empty();
                    $('form#form-upload-project #supervisor').append('<option value="">-- Select your supervisors ID --</option>');
                    $.each(data.info, function(i, item) {
                        $('form#form-upload-project #supervisor').append('<option value="'+item.id+'">'+item.name+'</option>');
                    });
                } 

            }
        });
    }
    function loadSuperProfileDetails(){
        $('form#updatesuperform #department').empty();
        $.ajax({
            url: restUrl+"fetch-departments.php",
            type: 'GET',
            dataType:'jsonp',
            contentType: false,
            crossDomain: true,
            data: {},
            cache: false,
            success : function(data, status) {
                $('form#updatesuperform #department').empty();
                if(data.status === 0 ){ 
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>Department loading error. '+data.msg+'</div>');
                }
                if(data.status === 2 ){ 
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>No department available for this department</div>');
                     $('form#updatesuperform #department').append('<option value="">-- No department available --</option>');
                }
                if(data.status ===1 && data.info.length === 0){
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>No department available .</div>');
                }
                else if(data.status ===1 && data.info.length > 0){
                    $('form#updatesuperform #department').empty().append('<option value="">-- Select your department --</option>');
                    $.each(data.info, function(i, item) {
                        $('form#updatesuperform #department').append('<option value="'+item.id+'">'+item.name+'</option>');
                    });
                    var profileDetails = {name:sessionStorage.supervisor, department:sessionStorage.supervisorDept, id:sessionStorage.supervisorEmail};
                    $.each(profileDetails, function(key, value) { 
                        $('form#updatesuperform  #'+key).val(value);  
                    });
                } 

            }
        });
    }
    function loadMyStudentsProjects(){
        $.ajax({
            url: restUrl+"fetch-projects.php",
            type: 'GET',
            dataType:'jsonp',
            contentType: false,
            crossDomain: true,
            data: {fetchForSupervisor: 'true', supervisor:sessionStorage.supervisorEmail, department:sessionStorage.supervisorDept },
            cache: false,
            success : function(data, status) {
                if(data.status == "1"){
                    $('ul#approveprojectslist').empty();
                    $("#messageBox, .messageBox").html('<div class="alert alert-success"><button type="button" class="close" data-dismiss="alert">&times;</button>You have '+data.info.length+' project(s) waiting for approval </div>');
                    $.each(data.info, function(i, item) {
                        if(item.fileType == "docx" || item.fileType == "doc" || item.fileType == "txt"){ src = "images/icons/word.jpg"; }
                        else if(item.fileType == "pdf"){ src = "images/icons/pdf.jpg"; }
                        else{ src = "images/icons/blank.jpg"; }
                        projectFile = siteRoot+'project/'+item.projectFile;
                        $('ul#approveprojectslist').append('<li><div class="feat_small_icon"><img src="'+src+'" alt="" title="" /></div><div class="feat_small_details"><h4>'+item.title+'</h4><div style="padding:5px 0px 5px 0px"><strong style="font-weight:bold;">Category:</strong> '+item.category+' <br/><strong style="font-weight:bold;">Student:</strong> '+item.author+' <br/><strong style="font-weight:bold;">Date Uploaded:</strong> '+item.dateUploaded+' <br/><strong style="font-weight:bold;">Project Year:</strong> '+item.year+' <br/><strong style="font-weight:bold;">Actions:</strong> '+item.actionLink+' </div><div class="hidden">These</div><br/><a href="'+projectFile+'" class="button_small downloadLink">Download</a></div> </li> ');
                    });
                }
                else {
                    $('ul#approveprojectslist').empty();
                    $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>No project available for approval. Please check later.</div>');
                }
                $('ul#approveprojectslist').append('<input type="button" class="close-popup form_submit" style="background:#3c3c3c" value="Close" />');
            },
            error : function(xhr, status) {
                erroMsg = '';
                if(xhr.status===0){ erroMsg = 'There is a problem connecting to internet. Please review your internet connection.'; }
                else if(xhr.status===404){ erroMsg = 'Requested page not found.'; }
                else if(xhr.status===500){ erroMsg = 'Internal Server Error.';}
                else if(status==='parsererror'){ erroMsg = 'Error. Parsing JSON Request failed.'; }
                else if(status==='timeout'){  erroMsg = 'Request Time out.';}
                else { erroMsg = 'Unknow Error.\n'+xhr.responseText;}          
                $("#messageBox, .messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>'+erroMsg+'</div>');
                $('ul#approveprojectslist').append('<input type="button" class="close-popup form_submit" style="background:#3c3c3c" value="Close" />');
            }
        });
    }
    function approvalThisProject(projectId, status){
        $.ajax({
            url: restUrl+"manage-projects.php",
            type: 'GET',
            dataType:'jsonp',
            contentType: false,
            crossDomain: true,
            data: {approveProject: 'true', id:projectId, status:status},
            cache: false,
            success : function(data, status) {
                if(data.status =='1'){
                    $("#messageBox, .messageBox").html('<div class="alert alert-success"><button type="button" class="close" data-dismiss="alert">&times;</button>Project has been '+currentStatus+'d.<img src="images/cycling.GIF" width="30" height="30" alt="Ajax Loading"> Re-loading...</div>');
                    //setInterval(function(){ window.location="";}, 2000);
                    loadMyStudentsProjects();
                }
                else {
                    $("#messageBox, .messageBox").empty().html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>Project approval failed.</div>');
                }
            }
        });
    }
    function deleteThisProject(projectId, projectFile){
        $.ajax({
            url: restUrl+"manage-projects.php",
            type: 'GET',
            dataType:'jsonp',
            contentType: false,
            crossDomain: true,
            data: {deleteProject: 'true', id:projectId, supervisor:sessionStorage.supervisorEmail, projectFile:projectFile},
            cache: false,
            success : function(data, status) {
                if(data.status == "1"){
                    $("#messageBox").html('<div class="alert alert-success"><button type="button" class="close" data-dismiss="alert">&times;</button>'+data.msg+' <img src="images/cycling.GIF" width="30" height="30" alt="Ajax Loading"> Re-loading...</div>');
                    //setInterval(function(){ window.location = "";}, 2000);                        
                    loadMyStudentsProjects();
                }
                else if(data.status != null && data.status != 1) {
                    $("#messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>Project deletion failed. '+data.msg+'</div>');
                }
                else {
                    $("#messageBox").html('<div class="alert alert-danger"><button type="button" class="close" data-dismiss="alert">&times;</button>Project deletion failed. '+data+'</div>');
                }
            }
        });
    } 
});