
$(document).ready(function() { 
    pageDisplay();
}); 

function pageDisplay() {
    bindEvent();
}


function bindEvent() {

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

    if( $("#loading").length > 0 ){
        $.post("/order/loading", function(results) {
            window.location.reload();
        });
    }

}

function orderPay() {
    $.post("/order/pay", function(results) {
        WeixinJSBridge.invoke('getBrandWCPayRequest', results, function(res) {
            if(res.err_msg == "get_brand_wcpay_request:ok" ) {
                window.location.replace(window.location.href + '&page=LOADING');
            } else {
                $("#orderPay").removeClass("disabled");
            }
        });
    });
}
