$(document).ready(function () {
$('.owl-carousel-main').owlCarousel({
      loop: true,
      margin: 10,
      navigation: false,
      nav:false,
      dots: false,
      navigationText: [
          "<i class='icon-chevron-left icon-white'></i>",
          "<i class='icon-chevron-right icon-white'></i>"
      ],
      autoplay: true,
      autoplayTimeout: 5000,
      items: 1
  });

$('.owl-carousel-property').owlCarousel({
      loop: true,
      margin: 10,
      navigation: true,
      nav:true,
      dots: false,
      navText: [
          "<i class='fa fa-chevron-left icon-white'></i>",
          "<i class='fa fa-chevron-right icon-white'></i>"
      ],
      autoplay: false,
      autoplayTimeout: 5000,
      items: 4
  });

var sync1 = $("#sync1");
 var sync2 = $("#sync2");
 var slidesPerPage = 4; //globaly define number of elements per page
 var syncedSecondary = true;

 sync1.owlCarousel({
   items : 1,
   slideSpeed : 2000,
   nav: true,
   autoplay: true,
   dots: false,
   loop: true,
   responsiveRefreshRate : 200,
   navText: ["<i class='fa fa-chevron-left icon-white'></i>",
             "<i class='fa fa-chevron-right icon-white'></i>"],
 }).on('changed.owl.carousel', syncPosition);

 sync2
   .on('initialized.owl.carousel', function () {
     sync2.find(".owl-item").eq(0).addClass("current");
   })
   .owlCarousel({
   items : slidesPerPage,
   dots: false,
   nav: true,
   smartSpeed: 200,
   slideSpeed : 500,
   slideBy: slidesPerPage, //alternatively you can slide by 1, this way the active slide will stick to the first item in the second carousel
   responsiveRefreshRate : 100
 }).on('changed.owl.carousel', syncPosition2);

 function syncPosition(el) {
   //if you set loop to false, you have to restore this next line
   //var current = el.item.index;

   //if you disable loop you have to comment this block
   var count = el.item.count-1;
   var current = Math.round(el.item.index - (el.item.count/2) - .5);

   if(current < 0) {
     current = count;
   }
   if(current > count) {
     current = 0;
   }

   //end block

   sync2
     .find(".owl-item")
     .removeClass("current")
     .eq(current)
     .addClass("current");
   var onscreen = sync2.find('.owl-item.active').length - 1;
   var start = sync2.find('.owl-item.active').first().index();
   var end = sync2.find('.owl-item.active').last().index();

   if (current > end) {
     sync2.data('owl.carousel').to(current, 100, true);
   }
   if (current < start) {
     sync2.data('owl.carousel').to(current - onscreen, 100, true);
   }
 }

 function syncPosition2(el) {
   if(syncedSecondary) {
     var number = el.item.index;
     sync1.data('owl.carousel').to(number, 100, true);
   }
 }

 sync2.on("click", ".owl-item", function(e){
   e.preventDefault();
   var number = $(this).index();
   sync1.data('owl.carousel').to(number, 300, true);
 });

});

function changeDis(ele){
  var sr=$(ele).attr('src');
  $('#disPlayImg').attr('src',sr);
}

function printDiv(divName) {
     var printContents = document.getElementById(divName).innerHTML;
     var originalContents = document.body.innerHTML;

     document.body.innerHTML = printContents;

     window.print();

     document.body.innerHTML = originalContents;
}

function checkPrivacy(ele,btn) {
    if($(ele).is(':checked')){
        $(btn).removeAttr('disabled');
    }else{
        $(btn).attr('disabled',true);
    }

}