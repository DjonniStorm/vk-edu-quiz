import { Box, Text } from "@mantine/core";
import QRCode from "react-qr-code";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/app/i18n";

export interface InviteQrCodeProps {
  inviteUrl: string;
}

export const InviteQrCode = ({ inviteUrl }: InviteQrCodeProps) => {
  const { t } = useTranslation();

  if (!inviteUrl) {
    return null;
  }

  return (
    <Box ta="center">
      <Text size="sm" c="dimmed" mb="xs">
        {t(LANG_KEYS.pages.room.host.scanToJoin)}
      </Text>
      <Box
        p="sm"
        bg="white"
        style={{
          display: "inline-block",
          borderRadius: 8,
          border: "1px solid #e5e7ef",
        }}
      >
        <QRCode value={inviteUrl} size={168} level="M" />
      </Box>
    </Box>
  );
};
