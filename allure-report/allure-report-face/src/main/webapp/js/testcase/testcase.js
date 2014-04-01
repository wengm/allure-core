/*global angular:true */
angular.module('allure.testcase.controllers', [])
    .controller('TestcaseCtrl', function($scope, $state, testcase, treeUtils, Collection) {
        "use strict";
        function isFailed(step) {
            return ['FAILED', 'BROKEN', 'SKIPPED'].indexOf(step.status) !== -1;
        }
        function getAllAttachments() {
            var attachments = [];
            treeUtils.walkAround($scope.testcase, 'steps', function(item) {
                if(item !== $scope.testcase) {
                    attachments = attachments.concat(item.attachments);
                }
            });
            return attachments.concat($scope.testcase.attachments);
        }
        function setAttachment(source) {
            $scope.attachment = getAllAttachments().filter(function(attachment) {
                return attachment.source === source;
            })[0];
        }
        $scope.isState = function(state) {
            return $state.is(baseState+'.'+state);
        };
        $scope.closeTestcase = function() {
            $state.go(baseState);
        };
        $scope.go = function(state) {
            $state.go(baseState+'.'+state);
        };
        $scope.setAttachment = function(attachmentUid) {
            $state.go(baseState+'.testcase.attachment', {attachmentUid: attachmentUid});
        };
        $scope.select = function(direction) {
            var index = allAttachments.indexOf($scope.attachment);
            setAttachment((direction < 0 ? allAttachments.getPrevious(index) : allAttachments.getNext(index)).source);
        };

        $scope.testcase = testcase;
        var baseState = $state.current.data.baseState,
            allAttachments = new Collection(getAllAttachments());
        $scope.failure = testcase.failure;
        delete testcase.failure;

        function findFailedStep(step) {
            var hasFailed = step.steps.some(findFailedStep);
            if(isFailed(step) && !hasFailed) {
                step.failure = $scope.failure;
                return true;
            }
            return hasFailed;
        }
        findFailedStep($scope.testcase);

        $scope.$on('$stateChangeSuccess', function(event, state, params) {
            delete $scope.attachment;
            if(params.attachmentUid) {
                setAttachment(params.attachmentUid);
            }
        });
    })
    .controller('StepCtrl', function($scope, $locale) {
        "use strict";
        function isFailed(step) {
            return ['FAILED', 'BROKEN', 'SKIPPED'].indexOf(step.status) !== -1;
        }
        var stepPlural = {
                one: ' sub-step',
                other: ' sub-steps'
            },
            attachmentPlural = {
                one: ' attachment',
                other: ' attachments'
            };
        $scope.getStepClass = function(step) {
            if(isFailed(step)) {
                return 'text-status-'+step.status.toLowerCase();
            }
            return '';
        };
        $scope.formatSummary = function(step) {
            var result = [];
            if(step.summary.steps + step.summary.attachments === 0) {
                return '';
            }
            if(step.summary.steps) {
                result.push(step.summary.steps + stepPlural[$locale.pluralCat(step.summary.steps)]);
            }
            if(step.summary.attachments) {
                result.push(step.summary.attachments + attachmentPlural[$locale.pluralCat(step.summary.attachments)]);
            }
            return '('+result.join(', ')+')';
        };
        $scope.expanded = isFailed($scope.step);
        $scope.hasContent = $scope.step.summary.steps > 0 || $scope.step.attachments.length > 0 || $scope.step.failure;
    })

    .controller('AttachmentPreviewCtrl', function ($scope, $http, $state) {
        "use strict";
        function fileGetContents(url) {
            //get raw file content without parsing
            $http.get(url, {transformResponse: []}).then(function(response) {
                $scope.attachText = response.data;
            });
        }
        $scope.getSourceUrl = function(attachment) {
            return 'data/'+attachment.source;
        };
        $scope.isExpanded = function() {
            return $state.is('home.testsuite.testcase.attachment.expanded');
        };
        $scope.toggleExpanded = function() {
            $state.go('home.testsuite.testcase.attachment'+
                ($scope.isExpanded() ? '' : '.expanded')
            );
        };
        $scope.$watch('attachment', function(attachment) {
            //noinspection FallthroughInSwitchStatementJS
            switch (attachment.type) {
                case 'JPG':
                case 'PNG':
                    $scope.type = "image";
                    break;
                case 'TXT':
                    $scope.type = "text";
                    fileGetContents($scope.getSourceUrl(attachment));
                    break;
                case 'XML':
                case 'JSON':
                    $scope.type = "code";
                    fileGetContents($scope.getSourceUrl(attachment));
                    break;
                default:
                    delete $scope.type;
            }
        });
    });
angular.module('allure.testcase', ['allure.testcase.statusSwitcher', 'allure.testcase.testcasesList', 'allure.testcase.controllers', 'allure.testcase.provider']);
