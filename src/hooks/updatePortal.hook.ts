import DraftPostModel from "@/models/draft.model";
import {
  UpdatePortalPostBody,
  UpdatePortalPostBodyType,
} from "@/schemaValidation/post.schema";
import { prefixImageSrc } from "@/utils/MdHandler";
import axios from "axios";

import { format } from "date-fns";
import envConfig from "config";

async function updatePortalHook({
  metadata,
  content,
  categories,
  lang,
  id,
  portal_thumb,
  portal_background,
}: {
  metadata: {
    title?: string | undefined;
    thumbnail?: string | undefined;
    sdgs?: number[] | undefined;
    description?: string | undefined;
    publishDate?: string | Date | undefined;
    draft?: boolean | undefined;
    eventTime?: string | Date | undefined;
  };
  content?: string;
  categories?: number[] | null;
  lang: LangType;
  id: string;
  portal_thumb?: string;
  portal_background?: string;
}) {
  const portalModel = new DraftPostModel(lang);
  // Deep copy metadata to portal and add content to it, because metadata is original object and we can't modify it directly
  const portal: UpdatePortalPostBodyType = {
    ...JSON.parse(JSON.stringify(metadata)),
    content,
  };
  portal.shortDesc = metadata.description;

  // Định dạng theo yêu cầu: "dd/MM/yyyy HH:mm:ss"
  const formattedDate = format(new Date(), "dd/MM/yyyy HH:mm:ss");

  if (categories && categories.length > 0)
    portal.categories = categories as [number, ...number[]];

  // Make sure all image tags start with server domain
  if (content) portal.content = prefixImageSrc(content);

  portal.lang = lang;
  portal.id = Number(id);
  portal.thumbnail = portal_thumb;
  portal.background = portal_background;

  const parse = UpdatePortalPostBody.safeParse(portal);

  if (!parse.success) {
    throw new Error(parse.error.message);
  }

  const portalBody = {
    ...parse.data,
    updateDate: formattedDate,
  };

  const response: { status: string; message: string; elements: string } = (
    await axios.post(
      "https://api.ueh.edu.vn/api/news/update-news",
      portalBody,
      {
        headers: {
          authorization: envConfig.PORTAL_AUTHORIZATION,
          "Content-Type": "application/json",
        },
      },
    )
  ).data;

  if (response.status !== "success") throw new Error(response.elements);

  await portalModel.updatePortalRecord({
    id,
    categories: portal.categories,
    portal_thumb: portalBody.thumbnail,
    portal_background: portalBody.background,
  });
}

export default updatePortalHook;
