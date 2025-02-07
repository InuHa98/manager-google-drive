jQuery.fn.sortElements = (function(){
    
    var sort = [].sort;
    
    return function(comparator, getSortable) {
        
        getSortable = getSortable || function(){return this;};
        
        var placements = this.map(function(){
            
            var sortElement = getSortable.call(this),
                parentNode = sortElement.parentNode,
                
                nextSibling = parentNode.insertBefore(
                    document.createTextNode(''),
                    sortElement.nextSibling
                );
            
            return function() {
                
                if (parentNode === this) {
                    throw new Error(
                        "You can't sort elements if any one is a descendant of another."
                    );
                }
                
                parentNode.insertBefore(this, nextSibling);
                parentNode.removeChild(nextSibling);
                
            };
            
        });
       
        return sort.call(this, comparator).each(function(i){
            placements[i].call(getSortable.call(this));
        });
        
    };
    
})();
function sortTable(options){

	var table = options.table;
	var column = options.column;

	if(!table || !column){
		return false;
	}

    table.find("th").each(function(){
        
        if($.inArray($(this).index(), column) !== -1){
	        var th = $(this),
	            thIndex = th.index(),
	            inverse = true;


	        th.css("cursor", "pointer");
	        
	        th.click(function(){
	            var this_index = $(this).index();
	        	table.find("th span.sort-table").each(function(){
	        		if($(this).parents("th").index() != this_index)
	        			$(this).remove();
	        	});

	            var icon = $(this).find("span.sort-table");
	            if(icon.length > 0){
		            if(icon.hasClass("sort-table-asc")){
		            	icon.removeClass("sort-table-asc");
		            	icon.addClass("sort-table-desc");
		            	icon.html(options.icon['desc']);
		            } else {
		            	icon.removeClass("sort-table-desc");
		            	icon.addClass("sort-table-asc");
		            	icon.html(options.icon['asc']);	
		            }           	
	            } else {
	            	$(this).prepend('<span class="sort-table sort-table-desc">'+options.icon['desc']+'</span>');
	            }


	            table.find('td').filter(function(){
	                
	                return $(this).index() === thIndex;
	                
	            }).sortElements(function(a, b){
	                
	                return $.text([a]) > $.text([b]) ?
	                    inverse ? -1 : 1
	                    : inverse ? 1 : -1;
	                
	            }, function(){
	                
	                return this.parentNode; 
	                
	            });
	            
	            inverse = !inverse;
	                
	        });        	
        }


    });
}

function scrollTable(table){
	var $tr = table.find('thead tr')
	table.on('scroll', function() {
		$tr.css('transform', 'translateY('+ this.scrollTop +'px)');
	});
}

function addScreenLoading(parent, _class = ""){
	var $parent = parent ? ((typeof parent == 'string') ? $(parent) : parent) : $("body");
	
	if($parent.children(".screen_loading").length < 1){
		$parent.append('<div class="screen_loading '+_class+'"><div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>');	
	}
}

function removeScreenLoading(parent){
	var $parent = parent ? ((typeof parent == 'string') ? $(parent) : parent) : $("body");

	if($parent.children(".screen_loading").length > 0){
		$parent.children(".screen_loading").remove();	
	}
}

function dropdownmenu(parent, difference_rate = 20){
	var $parent = (typeof parent == 'string') ? parent : ".dropdown";
	if($parent === null){
		return false;
	}

	$(document).on("click", $parent,  function(e){
		e.stopPropagation();
		let ele_menu = $(this).children(".drop-menu");

		let bgHide = $("<div class='dropdown-bg-hide'></div>");
		if($(this).hasClass("show")){
			$(this).removeClass("show");
			bgHide.remove();
		} else {
			$(document).find($parent).removeClass("show");
			$(this).addClass("show");
			$(this).prepend(bgHide);


			let offset = this.getBoundingClientRect();
			let padding = difference_rate * 2;


			let top = offset.top - (ele_menu.outerHeight() / 2), // mid y
				left = offset.left - (ele_menu.outerWidth() / 2), // mid x
				__x_origin = 'left',
				__y_origin = 'top';


			if(($(window).height() - offset.top) > ele_menu.outerHeight()){ // bottom
				top = offset.top + difference_rate;
			} else if(offset.top > ele_menu.outerHeight()){ // top
				__y_origin = "bottom";
				top = offset.top - ele_menu.outerHeight() + (difference_rate * 2);
			}

			if(top <= 0){
				top = (difference_rate/ 2);
			}
			if((top + ele_menu.outerHeight()) >= $(window).height()){
				top = $(window).height() - ele_menu.outerHeight() - (difference_rate / 2);
			}

			if(($(window).width() - offset.left) > ele_menu.outerWidth() + padding){ // right
				left = offset.left;
			} else if(offset.left > ele_menu.outerWidth() + padding){ // left
				__x_origin = "right";
				left = offset.left - ele_menu.outerWidth() + $(this).width() + (difference_rate * 2);
			}

			if(left <= 0){
				left = (difference_rate / 2);
			}

			if((left + ele_menu.outerWidth()) >= $(window).width()){
				left = $(window).width() - ele_menu.outerWidth() - (difference_rate / 2);
			}

			ele_menu.css({
				"--x-origin": __x_origin,
				"--y-origin": __y_origin,
				top: top + 'px',
				left: left + 'px'
			});
		}

		bgHide.off("click.showMenu");
		bgHide.on("click.showMenu", function(e){
			$($parent+".show").removeClass("show");
			bgHide.remove();
		});
		ele_menu.find("li").on("click.showMenu", function(e){
			bgHide.remove();
		});
		$(window).off("resize.showMenu");
		$(window).on("resize.showMenu", function(){
			$($parent+".show").removeClass("show");
			bgHide.remove();
		});
	});
}

$(document).ready(function(){

	let arrow = document.querySelectorAll(".arrow");
	for (var i = 0; i < arrow.length; i++) {
		arrow[i].addEventListener("click", (e)=>{
			let arrowParent = e.target.parentElement.parentElement;//selecting main parent of arrow
			arrowParent.classList.toggle("showMenu");
		});
	}

	let sidebar = document.querySelector(".sidebar");
	let sidebarBtn = document.querySelector(".bx-menu");

	if(sidebarBtn){
		sidebarBtn.addEventListener("click", ()=>{
			sidebar.classList.toggle("close");
		});		
	}


	scrollTable($(".table-scroll"));

});

function setHeightListFiles(){
	let view = document.getElementById("scroll_view");
	if(view){
		view.style.height = window.innerHeight - view.getBoundingClientRect().top - 5 + 'px';			
	}
}
window.addEventListener("load", function(){
	setHeightListFiles();
});
window.addEventListener("resize", function(){
	setHeightListFiles();
});
window.addEventListener("orientationChange", function(){
	setHeightListFiles();
});