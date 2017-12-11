
$(document).ready(function() { 
	pageDisplay();
}); 

function pageDisplay() {
	takeItemToast();
	bindEvent();
	$('.carousel.carousel-slider').carousel();
	if(deviceInfo_type == 'ZHIJIN') {
		$('.carousel.carousel-slider').carousel('set', 0);
	} else if(deviceInfo_type == 'JUANZHI') {
		$('.carousel.carousel-slider').carousel('set', 1);
	}
}

function takeItemToast() {
	if(takeItemRes == 'SUCCESS') {
    	Materialize.toast('领取成功！', 4000);
    } else if(takeItemRes == 'FAIL') {
    	Materialize.toast('领取失败！', 4000);
    } else if(takeItemRes == 'NO_BALANCE') {
    	Materialize.toast('余额不足！', 4000);
    } else if(takeItemRes == 'OVERTIME') {
    	window.location.reload();
    	Materialize.toast('登录超时！', 4000);
    }
    takeItemRes = null;
}

function bindEvent() {
	$("#home").click(function(){
		$.post("/page/home", function(results) {
			$('#frame-content').html(results);
			pageDisplay();
		});
	});

	$("#order").click(function(){
		$("#order").addClass("disabled");
		$.post("/page/order", function(results) {
			$('#frame-content').html(results);
			pageDisplay();
		});
	});

	$("#orderPay").click(function(){
		$("#orderPay").addClass("disabled");
	    if (typeof WeixinJSBridge == "undefined"){
	        if( document.addEventListener ){
	            document.addEventListener('WeixinJSBridgeReady', orderPay, false);
	        }else if (document.attachEvent){
	            document.attachEvent('WeixinJSBridgeReady', orderPay); 
	            document.attachEvent('onWeixinJSBridgeReady', orderPay);
	        }
	    }else{
	        orderPay();
	    }
	});

	$("#loading").click(function(){
		$("#loading").addClass("disabled");
		$.post("/page/loading", function(results) {
			$('#frame-content').html(results);
			pageDisplay();
		});
	});

	if( $("#loaded").length > 0 ){
		$.post("/page/loading/loaded", function(results) {
			$('#frame-content').html(results);
			pageDisplay();
		});
	}

}

function orderPay() {
	$.post("/page/order/pay", function(results) {
	    WeixinJSBridge.invoke('getBrandWCPayRequest', results, function(res) {
	        if(res.err_msg == "get_brand_wcpay_request:ok" ) {
				$.post("/page/loading", function(results) {
					$('#frame-content').html(results);
					pageDisplay();
				});
	        } else {
				$("#orderPay").removeClass("disabled");
			}
	    });
	});
}
