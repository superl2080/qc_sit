
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
    var token = GetUrlParam('token');
    var orderId = GetUrlParam('orderId');
    $.post("/order/pay",{
        token: token,
        orderId: orderId
    }, function(results) {
        WeixinJSBridge.invoke('getBrandWCPayRequest', results, function(res) {
            if(res.err_msg == "get_brand_wcpay_request:ok" ) {
                window.location.replace(window.location.href + '&page=LOADING');
            } else {
                $("#orderPay").removeClass("disabled");
            }
        });
    });
}

function GetUrlParam(paraName) {
    var url = document.location.toString();
    var arrObj = url.split("?");

    if (arrObj.length > 1) {
        var arrPara = arrObj[1].split("&");
        var arr;

        for (var i = 0; i < arrPara.length; i++) {
            arr = arrPara[i].split("=");

            if (arr != null && arr[0] == paraName) {
                return arr[1];
            }
        }
        return "";
    }
    else {
        return "";
    }
}
