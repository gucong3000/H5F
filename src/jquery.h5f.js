/*
 * HTML5表单验证，低端浏览器下依赖H5F.js并按需加载
 * $.fn.h5validity
 * 基本表单验证函数，高级浏览器下，去除浏览器默认提示框，低级浏览器下加载H5F并模拟invalid事件

 * $.fn.jmucvalidate
 * 用户中心的表单验证函数，基于$.fn.h5validity，实现了错误提示样式
 */
"use strict";
(function($){
	var input = $("<input>")[0],
		support = "validity" in input && "checkValidity" in input,
		doc = document,
		initInvalid;	

	//如果浏览器不支持HTML5,则加载h5f.js
	if(!support){
		doc.writeln("<script src=\""+ $(doc.scripts ? doc.scripts[doc.scripts.length - 1] : "script:last").attr("data-h5f")+"\"></script>");
	}

	//回调的触发
	function validityCall(opt, e){
		if(opt.validity){
			opt.validity.call(e.target, e);
		}
	}

	//支持HTML5验证的浏览器，使用用户自己的class
	function toggleClass(node, opt){
		var v = node.validity;
		if(v) {
			node = $(node);

			opt.validClass && node.toggleClass(opt.validClass, v.valid);
			opt.invalidClass && node.toggleClass(opt.invalidClass, (!v.valueMissing && !v.valid));
			opt.requiredClass && node.toggleClass(opt.requiredClass, v.valueMissing);
			opt.placeholderClass && node.toggleClass(opt.placeholderClass, (!node.val() && node.placeholder));
		}
	}

	function initInvalid(form, opt){

		//invalid事件处理函数
		function invalidFn(e){
			//阻止事件冒泡
			e.stopPropagation();
			//为了去掉默认样式，阻止全部浏览器默认行为；
			e.preventDefault();
			validityCall(opt, e);
		}

		//绑定事件处理函数
		function prevent(node){
			return $(node).bind("invalid", invalidFn);
		}

		//不支持HTML5验证的浏览器，使用H5F
		if(!support){
			H5F.setup(form, opt);
		}

		//将现有表单元素去除默认行为
		prevent(form.elements);
		form = prevent(form).delegate(":text,textarea", "change", function(e){
			//文本框自动trim
			var input = e.target;

			if(/^\s+$/.test(input.value)){
				input.value = $.trim(input.value);
			}
		});

		if(support || doc.createEvent) {

			form.bind("DOMNodeInserted", function(e){
				var target = e.target;
				if("validity" in target && "checkValidity" in target){
					//将动态添加的元素去除默认行为
					prevent(target);
				}
			});

			if(support){
				//由于阻止了默认事件，需要重新模拟焦点行为
				form.delegate(":submit", "click", function(e){
					var invalid = this.form.querySelector(":invalid");
					invalid && invalid.focus();
				}).bind("change", function(e){
					toggleClass(e.target, opt);
				});
			}
		}
	};

	/*表单验证公共组件*/
	$.fn.h5f = function(opt){
		opt = $.extend({
			validClass : "valid",
			invalidClass : "error",
			requiredClass : "required",
			placeholderClass : "placeholder"
		}, opt);

		if(opt.events){
			for(var i in opt.events){
				this.delegate(i, opt.events[i], function(e){
					var input = e.target;
					//狗日的IE10、11在change事件发生时select标签的validity还未更新，所以延迟
					window.setTimeout(function(){
						if(input.checkValidity && input.checkValidity()){
							validityCall(opt, e);
						}
					}, 1);
				});
			}
		}

		return this.each(function(){
			initInvalid(this, opt);
		});
	};

})(jQuery);
