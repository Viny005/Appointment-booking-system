import "server-only";import {randomUUID} from "node:crypto";import {join} from "node:path";import {ProfileImages} from "@/modules/profile-images/application/images";import {fileImageStorage} from "@/modules/profile-images/infrastructure/file-storage";import {sharpImageProcessor} from "@/modules/profile-images/infrastructure/sharp";
export const profileImageRoot=()=>process.env.PROFILE_IMAGE_DIR||join(process.cwd(),".data","profile-images");
export const profileImages=()=>new ProfileImages(fileImageStorage(profileImageRoot()),sharpImageProcessor,randomUUID);
export const profileImageStorage=()=>fileImageStorage(profileImageRoot());
