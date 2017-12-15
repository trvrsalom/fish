var settings = {
	"fish" : 100,
	"fish_speed" : 0.01,
	"fish_speed_limit" : 0.5,
	"fish_radius" : 3,
	"object_radius" : 6,
	"fish_border" : 1,
	"fish_sight_radius" : 50,
	"cohesion_weight" : 0.01,
	"cohesive_heading_weight" : 0.05,
	"noise" : 0.1,
	"avoid_radius" : 10,
	"avoid_weight" : 0.5,
	"fish_hitbox" : 10,
	"fish_color" : "#ffd2cc",
	"ui_color" : "#f45942",
	"draw_friendship" : false,
	"obstacle_color" : "#000",
	"obstacle_weight" : 0.02
}

var canvas = document.getElementsByClassName("ctx")[0];
var ctx = canvas.getContext("2d");
var fishes = [];
var obstacles = [];
var width, height, start;
var selected_fish = -1;
var reload = false
var first = true

var resize = function() {
	ctx.canvas.height = window.innerHeight;
	ctx.canvas.width = window.innerWidth;
};

var drawBackground = function() {
	ctx.lineWidth = 2;
	ctx.fillStyle = "#99c6ff";
	ctx.fillRect(0,0,canvas.width,canvas.height);
};

var randomColor = function() {
    var o = Math.round, r = Math.random, s = 255;
    return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + 0 + ',' + ((r().toFixed(1)*0.75)+0.25) + ')';
};

var distance = function(pointA, pointB) {
	return Math.sqrt(Math.pow(pointA.x-pointB.x,2) + Math.pow(pointA.y-pointB.y,2));
};

var subtract = function(pointA, pointB) {
	return {"x":pointA.x-pointB.x,"y":pointA.y-pointB.y};
};

var sum = function(pointA, pointB) {
	return {"x":pointA.x+pointB.x,"y":pointA.y+pointB.y};
};

var divide = function(pointA, c) {
	return {"x":pointA.x/c,"y":pointA.y/c};
};

var updateSetting = function(setting) {
	var type = typeof(settings[setting])
	var input = $("#" + setting).val()
	if(type == "number") {
		settings[setting] = parseFloat(input)
	}
}

var settingsPaneSetup = function() {
	for(var i = Object.keys(settings).length-1; i >= 0; i--) {
		var setting = Object.keys(settings)[i]
		var value = settings[setting]
		var elm = null
		if(typeof value == "number") {
			console.log("yep")
			elm = $(".controls").prepend("<span class='label'>" + setting + "</span> <input id='" + setting + "'type='text' value='" + value + "' onchange='updateSetting(\"" + setting + "\")'><br />")
		}
	}
}

var setup = function() {
	resize();
	$(window).on('resize', function(){
		resize();
		drawBackground();
	});
	$(canvas).click(function(e) {
		var click = { "x" : e.clientX, "y" : e.clientY };
		selected_fish = -1;
		for(i in fishes) {
			var fish = fishes[i];
			if(distance(fish, click) < settings.fish_hitbox) {
				selected_fish = i;
				return;
			}
		}
		for(i in obstacles) {
			var obstacle = obstacles[i];
			if(distance(obstacle, click) < settings.object_radius) {
				obstacles.splice(i, 1);
				return;
			}
		}
		obstacles.push(click)
	})
	drawBackground();
	for(var i = 0; i < settings.fish; i++) {
		fishes.push({
			"heading" : Math.random()*360,
			"x" : (Math.random()*(canvas.width - (2*settings.fish_border))) + settings.fish_border,
			"y" : (Math.random()*(canvas.height - (2*settings.fish_border))) + settings.fish_border,
			"vx" : (Math.random()*settings.fish_speed_limit-settings.fish_speed_limit/2)/2,
			"vy" : (Math.random()*settings.fish_speed_limit-settings.fish_speed_limit/2)/2,
			"color" : randomColor(),
			"centerPoint" : null
		});
	}
	if(first) settingsPaneSetup()
	first = false
};

var restart = function() {
	reload = true
	fishes = []
	obstacles = []
	selected_fish = -1
}

var boids = function(fish, visibleFish, visibleObstacles) {
	var avoidVector = {"x":0, "y":0}
	var centerPoint = {"x":0, "y":0}
	var dirVector = {"x":0, "y":0}
	var obstacleVector= {"x":0, "y":0}
	for(i in visibleFish) {
		var friend = visibleFish[i];
		var dist = distance(fish, friend);
		if(dist > 0 && dist < settings.avoid_radius) {
			var diff = subtract(fish, friend);
			diff = divide(diff, dist)
			avoidVector = sum(avoidVector, diff)
		}
		if(dist > 0 && dist < settings.fish_sight_radius) {
			centerPoint.x += friend.x
			centerPoint.y += friend.y
			var friendHeading = {"x": friend.vx, "y":friend.vy}
			friendHeading = divide(friendHeading, dist)
			dirVector = sum(dirVector, friendHeading)
			if(settings.draw_friendship) {
				ctx.beginPath();
				ctx.moveTo(fish.x, fish.y);
				ctx.lineTo(friend.x, friend.y);
				ctx.strokeStyle = settings.ui_color;
				ctx.stroke();
				ctx.closePath();
			}
		}
	}
	for(i in visibleObstacles) {
		var obstacle = visibleObstacles[i];
		var dist = distance(fish, obstacle);
		if(dist > 0 && dist < settings.fish_sight_radius) {
			var diff = subtract(fish, obstacle);
			diff = divide(diff, dist)
			obstacleVector = sum(obstacleVector, diff)
		}
	}

	centerPoint = divide(centerPoint, visibleFish.length)
	var centerDistance = distance(fish, centerPoint);
	var centerVector = subtract(centerPoint, fish);
	if(centerDistance != 0 && centerVector.y != 0 && centerVector.x != 0)
		centerVector = divide(centerVector, centerDistance)
	fish.centerPoint = centerPoint
	if(isNaN(fish.vx) || isNaN(fish.vy)) {
		fish.vx = fish.vy = 0
	}
	if(isNaN(fish.x) || isNaN(fish.y)) {
		fish.x = fish.y = 0
	}
	var dx = avoidVector.x*settings.avoid_weight
		   + centerVector.x*settings.cohesion_weight
		   + dirVector.x*settings.cohesive_heading_weight
		   + ((Math.random()-Math.random())*settings.noise)
		   + obstacleVector.x*settings.obstacle_weight
	var dy = avoidVector.y*settings.avoid_weight
		   + centerVector.y*settings.cohesion_weight
		   + dirVector.y*settings.cohesive_heading_weight
		   + ((Math.random()-Math.random())*settings.noise)
		   + obstacleVector.y*settings.obstacle_weight
	fish.vx += isNaN(dx) ? 0 : dx
	fish.vy += isNaN(dy) ? 0 : dy


};

var stop = false

var draw = function(timestamp) {
	ctx.clearRect(0,0,canvas.width,canvas.height);
	drawBackground();

	if (!start) start = timestamp;
	var progress = timestamp - start;
	for(i in obstacles) {
		var obstacle = obstacles[i];
		ctx.beginPath();
		ctx.fillStyle = settings.obstacle_color;
	    ctx.strokeStyle = settings.obstacle_color;
	    ctx.arc(obstacle.x, obstacle.y, settings.object_radius, 0, 2 * Math.PI, false);
	    ctx.fill();
	    ctx.lineWidth = 1;
	    ctx.stroke();
	    ctx.closePath();
	}
	for(i in fishes) {
		var fish = fishes[i];
		var visibleFish = [];
		var visibleObstacles = []
		for(b in fishes) {
			var otherFish = fishes[b]
			var dist = distance(fish, otherFish)
			if(dist < settings.fish_sight_radius && b != i) {
				visibleFish.push(otherFish)
				if(!settings.draw_friendship && i == selected_fish) {
					ctx.beginPath();
					ctx.moveTo(fish.x, fish.y);
					ctx.lineTo(otherFish.x, otherFish.y);
					ctx.strokeStyle = settings.ui_color;
					ctx.stroke();
					ctx.closePath();
				}
			}
		}
		for(b in obstacles) {
			var obstacle = obstacles[b]
			var dist = distance(fish, obstacle)
			if(dist < settings.fish_sight_radius && b != i) {
				visibleObstacles.push(obstacle)
				if(!settings.draw_friendship && i == selected_fish) {
					ctx.beginPath();
					ctx.moveTo(fish.x, fish.y);
					ctx.lineTo(obstacle.x, obstacle.y);
					ctx.strokeStyle = settings.ui_color;
					ctx.stroke();
					ctx.closePath();
				}
			}
		}

		if(i == selected_fish) {
	    	ctx.beginPath();
	    	ctx.arc(fish.x, fish.y, settings.fish_sight_radius, 0, 2 * Math.PI, false);
		    ctx.lineWidth = 1;
		    ctx.strokeStyle = settings.ui_color;
		    ctx.stroke();
		    ctx.closePath();
	    	if(visibleFish.length > 0) {
		    	ctx.beginPath();
		    	ctx.arc(fish.centerPoint.x, fish.centerPoint.y, settings.fish_radius, 0, 2 * Math.PI, false);
			    ctx.lineWidth = 1;
			    ctx.fillStyle = settings.ui_color;
	    		ctx.fill();
			    ctx.strokeStyle = settings.ui_color;
			    ctx.stroke();
			    ctx.closePath();
			    ctx.beginPath();
		    }
	    }

		boids(fish, visibleFish, visibleObstacles);

		if(Math.abs(fish.vx) > settings.fish_speed_limit) {
			fish.vx = (fish.vx/Math.abs(fish.vx))*settings.fish_speed_limit
		}
		if(Math.abs(fish.vy) > settings.fish_speed_limit) {
			fish.vy = (fish.vy/Math.abs(fish.vy))*settings.fish_speed_limit
		}

		fish.x += fish.vx
		fish.y += fish.vy

		if(fish.x >= canvas.width - settings.fish_border) fish.vx *= -1;
		else if(fish.x <= settings.fish_border) fish.vx *= -1;

		if(fish.y >= canvas.height - settings.fish_border) fish.vy *= -1;
		else if(fish.y <= settings.fish_border) fish.vy *= -1;


		ctx.beginPath();
		ctx.fillStyle = fish.color;
	    ctx.strokeStyle = fish.color;
	    ctx.arc(fish.x, fish.y, settings.fish_radius, 0, 2 * Math.PI, false);
	    ctx.fill();
	    ctx.lineWidth = 1;
	    ctx.stroke();
	    ctx.closePath();
	    
	}
	if(!reload) {
		setTimeout(function() {
		    window.requestAnimationFrame(draw);
		}, 500 - progress);
	}
	else {
		reload = false
		setup();
		window.requestAnimationFrame(draw);
	}
};

setup();
window.requestAnimationFrame(draw);
