var app = angular.module('app', []);

app.controller("gitController", function ($scope, $http) {
		var cThis = this,
			gitRepoApi = "https://api.github.com/repos",
			open_issues_1D = [],
			open_issues_7D = [],
			issueId = null;

		$scope.gitUrlInput = "";
		$scope.userComment = "";
		$scope.inDay = 0;
		$scope.repoDetails = [];
		$scope.issueList = [];
		$scope.commentList = [];

		$scope.idSelectedIssue = null;
		$scope.isCommentLoading = false;
		$scope.isIssueLoading = false;


		// Handler Invoked when Enter key is pressed for Git Url 
		$scope.submitHandler = function () {
			var cThis = this;
			var gitUrlSplit = cThis.gitUrlInput.split("/"),
				gitRepo = gitUrlSplit[gitUrlSplit.length - 1],
				gitUser = gitUrlSplit[gitUrlSplit.length - 2],
				gitAPIUrl = gitRepoApi + "/" + gitUser + "/" + gitRepo + "/" + "issues?state=open" ;

			$scope.inDay = 0;
			$scope.repoDetails = [];
			$scope.issueList = [];
			$scope.commentList = [];

			open_issues_1D = [];
			open_issues_7D = [];

			$scope.isIssueLoading = true;

			$http({
				  method: 'GET',
				  url: gitAPIUrl,
				}).then(function successCallback(response) {
				    // this callback will be called asynchronously
				    // when the response is available

				    var d = new Date(),
				    	yesterday = new Date(),
				    	lastWeek = new Date();
				    var issueDate = null;

					yesterday.setDate(d.getDate() - 1);
					lastWeek.setDate(d.getDate() - 7);

					response.data.open_issues_count = response.data.length;
					response.data.open_issues_count_1D = 0;
					response.data.open_issues_count_7D = 0;

				    response.data.map(function (item) {

				    	issueDate = new Date(item.created_at);
				    	//item.open_issues_count_1D = 0;
				    	//item.open_issues_count_7D = 0;

				    	if (issueDate >= yesterday) {
				    		response.data.open_issues_count_1D++;
				    		open_issues_1D.push(item);
				    	}
				    	if (issueDate >= lastWeek) {
				    		response.data.open_issues_count_7D++;
				    		open_issues_7D.push(item);
				    	}

				    	//return item;
				    });

				    $scope.isIssueLoading = false;
				    $scope.repoDetails = response.data;

				  }, function errorCallback(response) {
				    // called asynchronously if an error occurs
				    // or server returns response with an error status.
				    console.log(response);
				  });
		}

		// Handler invoked on click of Issue Count. identifier is to signify the count
		$scope.getIssues = function (identifier) {
			//var cThis = this;
			$scope.issueList = [];
			$scope.commentList = [];
			$scope.idSelectedIssue = null;

			$scope.inDay = identifier;

			if (identifier === 1) {
				$scope.issueList = open_issues_1D;
			}
			else if (identifier === 7) {
				$scope.issueList = open_issues_7D;
			}

			else if (identifier === 0) {
				$scope.issueList = $scope.repoDetails;
			}
		}

		//Handler Invoked on click of Issue, and get the comments for that issue
		$scope.getComments = function (index) {
			var cThis = this,
				issue = cThis.issueList[index],
				commentAPI = issue.comments_url;

				issueId = issue.number;
				if ($scope.idSelectedIssue === index) {
					return;
				}

				$scope.idSelectedIssue = index;

				$scope.commentList = null;
				$scope.isCommentLoading = true;

				$http({
					  method: 'GET',
					  url: commentAPI,
					}).then(function successCallback(response) {
					    // this callback will be called asynchronously
					    // when the response is available
					    var localComment = JSON.parse(localStorage.getItem("localComment")) || {};

					    if (localComment[issueId]) {
					    	response.data = response.data.concat(localComment[issueId]);
					    } 

					    if (!response.data.length) {
					    	response.data = [{
					    		body: "Be the first to comment",
					    		isFirst: true
					    	}]
					    }
					    $scope.isCommentLoading = false;
					    $scope.commentList = response.data;

					  }, function errorCallback(response) {
					    // called asynchronously if an error occurs
					    // or server returns response with an error status.
					  });
		}

		// Handler to submit comment.
		// Comments are stored locally in LocalStorage with a unique idntifier as issue ID
		$scope.submitComment = function () {
			var id = issueId,
				localComment = JSON.parse(localStorage.getItem("localComment")) || {},
				item = {
					body: $scope.userComment,
					user:{
						login: "Current User"
					}
				};

			if (localComment[id]) {
				localComment[id].push(item);
			}
			else {
				localComment[id] = [item]
			}

			if ($scope.commentList.length === 1 && $scope.commentList[0].isFirst) {
				$scope.commentList = [];
			}

			$scope.commentList.push(item);

			//localComment[id].push(item);

			localStorage.setItem("localComment", JSON.stringify(localComment));

			$scope.userComment = "";
		}
})
