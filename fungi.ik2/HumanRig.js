import { Vec3 }	from "../fungi/maths/Maths.js";
import Pose 	from "./Pose.js";


//##############################################################################
class Chain{
	constructor( ik_align_axis="z" ){		
		this.bones			= [];			// Index to a bone in an armature / pose
		this.cnt			= 0;			// How many Bones in the chain
		this.len 			= 0;			// Chain Length
		this.len_sqr		= 0;			// Chain Length Squared, Cached for Checks without SQRT

		this.ik_align_axis	= ik_align_axis;
	}

	set_bones( pose, b_names ){
		let n, b;
		for( n of b_names ){
			b = pose.get_bone( n );
			this.len += b.len;
			this.bones.push( b.idx );
		}
		this.cnt		= b_names.length;
		this.len_str	= this.len ** 2;
	}
}


//##############################################################################
class HumanRig{
	constructor( e, use_root_offset=false ){
		this.entity = e;
		this.arm 	= e.Armature;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.bind_pose	= new Pose( this.arm );
		this.pose_a		= new Pose( this.arm );

		if( use_root_offset ){
			this.bind_pose.set_offset( e.Node.local.rot, null, e.Node.local.scl );
			this.pose_a.set_offset( e.Node.local.rot, null, e.Node.local.scl );
		}

		this.bind_pose.update_world();

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.chains = {};

		this.arm_l 	= new Chain( "x" );
		this.arm_r 	= new Chain( "x" );
		this.leg_l 	= new Chain( "z" );
		this.leg_r 	= new Chain( "z" );
		this.spine 	= new Chain( "z" );

		this.hip 	= null;
		this.foot_l = null;
		this.foot_r = null;
	}

	apply_pose(){ this.pose_a.apply(); return this; }

	/////////////////////////////////////////////////////////////////
	// 
	/////////////////////////////////////////////////////////////////
		set_hip( n ){ this.hip = this.bind_pose.get_bone( n ); return this; }

		set_arm_l(){ this.arm_l.set_bones( this.bind_pose, arguments ); return this; }
		set_arm_r(){ this.arm_r.set_bones( this.bind_pose, arguments ); return this; }
		set_leg_l(){ this.leg_l.set_bones( this.bind_pose, arguments ); return this; }
		set_leg_r(){ this.leg_r.set_bones( this.bind_pose, arguments ); return this; }
		set_feet( fl, fr ){
			this.foot_l = this.bind_pose.get_bone( fl );
			this.foot_r = this.bind_pose.get_bone( fr );
			return this;
		}

		set_chain( name, bone_ary ){
			this.chains[ name ] = new Chain().set_bones( this.bind_pose, bone_ary );
			return this;
		}

		set_bone_pos( b_idx, v ){ this.pose_a.set_bone( b_idx, null, v ); return this; }
		set_bone_rot( b_idx, v ){ this.pose_a.set_bone( b_idx, v ); return this; }

	/////////////////////////////////////////////////////////////////
	// 
	/////////////////////////////////////////////////////////////////		
		gen_tpose(){
			let chary = ( chain )=>{
				let ary = [];
				for( let i of chain.bones ) ary.push( this.bind_pose.bones[ i ].name );
				return ary;
			};

			if( this.leg_l.cnt > 0 ) Pose.align_chain( this.bind_pose, Vec3.DOWN, chary( this.leg_l ) );
			if( this.leg_r.cnt > 0 ) Pose.align_chain( this.bind_pose, Vec3.DOWN, chary( this.leg_r ) );
			if( this.arm_r.cnt > 0 ) Pose.align_chain( this.bind_pose, Vec3.RIGHT, chary( this.arm_r ) );
			if( this.arm_l.cnt > 0 ) Pose.align_chain( this.bind_pose, Vec3.LEFT, chary( this.arm_l ) );
			if( this.foot_l ) Pose.align_foot_forward( this.bind_pose, this.foot_l.name );
			if( this.foot_r ) Pose.align_foot_forward( this.bind_pose, this.foot_r.name );

			this.bind_pose.update_world();
			this.bind_pose.apply();
			return this;
		}
}

//##############################################################################
export default HumanRig;